'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';

// Global objects to track pending requests
const pendingRequests = {
  createChat: false,
  generateTitle: false,
  updateChat: new Set<string>(),
  saveMessage: new Set<string>(),
};

// Global cache for chat data
const chatDataCache: Record<string, {
  chat: any;
  messages: any[];
  timestamp: number;
}> = {};

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

// Simple flag to track if a chat is currently being loaded
const loadingChats = new Set<string>();

export function useChatStorage({ chatId, initialMessages = [] }: UseChatStorageProps = {}): UseChatStorageReturn {
  console.log(`[CHAT-STORAGE] useChatStorage hook initializing with chatId: ${chatId || 'null'}`);

  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Log when the hook mounts
  useEffect(() => {
    console.log(`[CHAT-STORAGE] useChatStorage hook mounted with chatId: ${chatId || 'null'}`);
    return () => {
      console.log(`[CHAT-STORAGE] useChatStorage hook unmounting with chatId: ${chatId || 'null'}`);
    };
  }, []);

  // Reference to track the current chat ID
  const currentChatIdRef = useRef<string | null>(null);

  // Reference to track API calls in progress for this component instance
  const apiCallsInProgressRef = useRef<{
    createChat: boolean;
    updateChat: boolean;
    generateTitle: boolean;
  }>({
    createChat: false,
    updateChat: false,
    generateTitle: false,
  });

  // Load chat by ID - simplified to prevent duplicate loads
  const loadChat = async (id: string) => {
    // Don't load if it's already the current chat or already loading
    if (id === currentChatIdRef.current || loadingChats.has(id)) {
      console.log(`[CHAT] Skipping load for ${id} - already current or loading`);
      return;
    }

    // Mark as loading
    loadingChats.add(id);
    setIsLoading(true);
    setError(null);

    try {
      console.log(`[CHAT] Loading chat ${id}`);

      // Check if we have a recent cache entry
      const cachedData = chatDataCache[id];
      const cacheMaxAge = 5 * 60 * 1000; // 5 minutes in milliseconds

      if (cachedData && (Date.now() - cachedData.timestamp) < cacheMaxAge) {
        console.log(`[CHAT] Using cached data for chat ${id}`);
        setChat(cachedData.chat);
        setMessages(cachedData.messages);
        currentChatIdRef.current = id;
        console.log(`[CHAT] Successfully loaded chat ${id} from cache`);
        return;
      }

      // No valid cache, fetch from API
      console.log(`[CHAT-FETCH] Fetching chat ${id} from API`);
      const response = await fetch(`/api/chats/${id}`);
      const data = await response.json();
      console.log(`[CHAT-FETCH] Received chat ${id} from API:`, data.chat?.title || 'unknown title');

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load chat');
      }

      // Update state
      setChat(data.chat);
      setMessages(data.chat.messages);
      currentChatIdRef.current = id;

      // Update cache
      chatDataCache[id] = {
        chat: data.chat,
        messages: data.chat.messages,
        timestamp: Date.now()
      };

      console.log(`[CHAT] Successfully loaded chat ${id}`);
    } catch (err: any) {
      setError(err.message || 'An error occurred while loading chat');
      console.error('[CHAT] Load chat error:', err);
      toast({
        title: 'Failed to load chat',
        description: err.message || 'An error occurred while loading chat',
        variant: 'destructive',
      });
    } finally {
      // Clean up
      loadingChats.delete(id);
      setIsLoading(false);
    }
  };

  // Track if this is the first mount
  const isFirstMountRef = useRef(true);

  // Initialize chat on mount or when chatId changes - simplified
  useEffect(() => {
    console.log(`[DEBUG-API-CALLS] chatId dependency changed to: ${chatId || 'null'}`);
    console.log(`[DEBUG-API-CALLS] Current stack trace:`, new Error().stack);

    if (!chatId) {
      console.log(`[DEBUG-API-CALLS] No chatId provided, skipping load`);
      return;
    }

    // Skip if this is not the first mount and chatId hasn't changed
    // This prevents unnecessary API calls when other dependencies change
    if (!isFirstMountRef.current && chatId === currentChatIdRef.current) {
      console.log(`[DEBUG-API-CALLS] Not first mount and chatId hasn't changed, skipping load`);
      return;
    }

    // Mark that we're no longer on first mount
    isFirstMountRef.current = false;

    // Only load if it's a different chat
    if (chatId !== currentChatIdRef.current) {
      console.log(`[DEBUG-API-CALLS] chatId (${chatId}) is different from current (${currentChatIdRef.current || 'null'}), loading chat`);
      loadChat(chatId);
    } else {
      console.log(`[DEBUG-API-CALLS] chatId (${chatId}) is already loaded, skipping`);
    }
  }, [chatId, loadChat]);

  // Generate a title based on chat messages - moved up to avoid circular dependency
  const generateTitle = useCallback(async (chatMessages: Message[]): Promise<string> => {
    // Create a unique key for this set of messages
    const messageKey = chatMessages
      .filter(msg => msg.role === 'user')
      .map(msg => msg.content.substring(0, 50))
      .join('_')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .substring(0, 100);

    const titleCacheKey = `generated_title_${messageKey}`;

    // Check if we've already generated a title for these messages
    const cachedTitle = localStorage.getItem(titleCacheKey);
    if (cachedTitle) {
      console.log(`[API] Using cached title: ${cachedTitle}`);
      return cachedTitle;
    }

    // Check if a title is already being generated (globally)
    if (pendingRequests.generateTitle) {
      console.log(`[API] Already generating a title, skipping duplicate request`);
      return 'New Chat';
    }

    // Check if this component instance is already generating a title
    if (apiCallsInProgressRef.current.generateTitle) {
      console.log(`[API] This component is already generating a title, skipping request`);
      return 'New Chat';
    }

    // Mark title generation as in progress
    pendingRequests.generateTitle = true;
    apiCallsInProgressRef.current.generateTitle = true;

    try {
      console.log(`[API] Generating title for chat with ${chatMessages.length} messages`);

      // Only generate a title if there are user messages
      const userMessages = chatMessages.filter(msg => msg.role === 'user');
      if (userMessages.length === 0) {
        console.log(`[API] No user messages found, using default title`);
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
          console.log(`[API] Generated title: ${titleData.title}`);

          // Cache the generated title
          localStorage.setItem(titleCacheKey, titleData.title);

          return titleData.title;
        }
      }

      console.log(`[API] Failed to generate title, using default`);
      return 'New Chat';
    } catch (error) {
      console.error('[API] Error generating title:', error);
      return 'New Chat';
    } finally {
      // Mark title generation as complete
      pendingRequests.generateTitle = false;
      apiCallsInProgressRef.current.generateTitle = false;
    }
  }, []);

  // Create a new chat
  const createChat = useCallback(async (title: string, chatMessages: Message[]): Promise<string> => {
    // Check if a chat is already being created (globally)
    if (pendingRequests.createChat) {
      console.log(`[API] Already creating a chat, skipping duplicate request`);
      return '';
    }

    // Check if this component instance is already creating a chat
    if (apiCallsInProgressRef.current.createChat) {
      console.log(`[API] This component is already creating a chat, skipping request`);
      return '';
    }

    // Mark chat creation as in progress
    pendingRequests.createChat = true;
    apiCallsInProgressRef.current.createChat = true;

    setIsLoading(true);
    setError(null);

    try {
      console.log(`[API] Creating new chat with title: ${title}`);

      // Skip title generation for initial chat creation to reduce API calls
      let chatTitle = title;

      // Only try to generate a title if explicitly requested and not the initial creation
      if (title !== 'New Chat' || chatMessages.length > 2) {
        const userMessages = chatMessages.filter(msg => msg.role === 'user');

        if (userMessages.length > 0 && title === 'New Chat') {
          try {
            // Use our generateTitle function
            chatTitle = await generateTitle(chatMessages);
          } catch (titleError) {
            console.error('[API] Error generating title:', titleError);
            // Continue with the default title if generation fails
          }
        }
      }

      // Create the chat with the title (generated or original)
      console.log(`[CHAT-FETCH] Creating new chat with title: "${chatTitle}" and ${chatMessages.length} messages`);
      const response = await fetch('/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: chatTitle, messages: chatMessages }),
      });

      const data = await response.json();
      console.log(`[CHAT-FETCH] Created new chat with ID: ${data.chat?.id || 'unknown'}`);
      console.log(`[CHAT-FETCH] Stack trace:`, new Error().stack);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create chat');
      }

      console.log(`[API] Chat created successfully with ID: ${data.chat.id}`);
      setChat(data.chat);
      setMessages(chatMessages);
      currentChatIdRef.current = data.chat.id;

      // Update cache
      chatDataCache[data.chat.id] = {
        chat: data.chat,
        messages: chatMessages,
        timestamp: Date.now()
      };

      return data.chat.id;
    } catch (err: any) {
      setError(err.message || 'An error occurred while creating chat');
      console.error('[API] Create chat error:', err);
      toast({
        title: 'Failed to create chat',
        description: err.message || 'An error occurred while creating chat',
        variant: 'destructive',
      });
      return '';
    } finally {
      // Mark chat creation as complete
      pendingRequests.createChat = false;
      apiCallsInProgressRef.current.createChat = false;
      setIsLoading(false);
    }
  }, [toast, generateTitle]);

  // Update chat title
  const updateChat = useCallback(async (title: string) => {
    if (!chat) {
      console.log(`[API] No chat available, skipping title update`);
      return;
    }

    const chatId = chat.id;

    // Check if this chat is already being updated (globally)
    if (pendingRequests.updateChat.has(chatId)) {
      console.log(`[API] Already updating chat ${chatId}, skipping duplicate request`);
      return;
    }

    // Check if this component instance is already updating a chat
    if (apiCallsInProgressRef.current.updateChat) {
      console.log(`[API] This component is already updating a chat, skipping request for ${chatId}`);
      return;
    }

    // Skip update if the title hasn't changed
    if (chat.title === title) {
      console.log(`[API] Title hasn't changed (${title}), skipping update`);
      return;
    }

    // Mark this chat as being updated
    pendingRequests.updateChat.add(chatId);
    apiCallsInProgressRef.current.updateChat = true;

    setIsLoading(true);
    setError(null);

    try {
      console.log(`[API] Updating chat ${chatId} title to: ${title}`);

      const response = await fetch(`/api/chats/${chatId}`, {
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

      console.log(`[API] Chat ${chatId} updated successfully`);
      setChat(data.chat);

      // Update cache if it exists
      if (chatDataCache[chatId]) {
        chatDataCache[chatId] = {
          ...chatDataCache[chatId],
          chat: data.chat,
          timestamp: Date.now()
        };
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while updating chat');
      console.error('[API] Update chat error:', err);
      toast({
        title: 'Failed to update chat',
        description: err.message || 'An error occurred while updating chat',
        variant: 'destructive',
      });
    } finally {
      // Remove this chat from the pending requests
      pendingRequests.updateChat.delete(chatId);
      apiCallsInProgressRef.current.updateChat = false;
      setIsLoading(false);
    }
  }, [chat, toast]);

  // The generateTitle function has been moved above createChat to avoid circular dependency

  // Update chat title if needed - guaranteed to be a one-time operation per chat
  const updateTitleBasedOnMessages = useCallback(async (chatMessages: Message[]) => {
    if (!chat) {
      console.log(`[API] No chat available, skipping title update`);
      return;
    }

    // Get the chat ID
    const chatId = chat.id;

    // Create a permanent key for this chat's title update status
    const titleUpdateKey = `title_update_${chatId}`;

    // Check if we've already updated the title for this chat
    if (localStorage.getItem(titleUpdateKey) === 'completed') {
      console.log(`[API] Title already updated for chat ${chatId}, skipping`);
      return;
    }

    // Check if we're currently updating the title for this chat
    if (localStorage.getItem(titleUpdateKey) === 'in_progress') {
      console.log(`[API] Title update in progress for chat ${chatId}, skipping`);
      return;
    }

    // Only update title if it's still the default "New Chat"
    if (chat.title !== 'New Chat') {
      console.log(`[API] Chat already has a custom title: ${chat.title}, skipping update`);
      localStorage.setItem(titleUpdateKey, 'completed');
      return;
    }

    // Only generate a title if we have at least 2 user messages
    const userMessages = chatMessages.filter(msg => msg.role === 'user');

    if (userMessages.length < 2) {
      console.log(`[API] Not enough user messages (${userMessages.length}) to generate title`);
      return;
    }

    console.log(`[API] Attempting to update title based on ${userMessages.length} user messages`);

    // Mark that we're attempting to update the title for this chat
    localStorage.setItem(titleUpdateKey, 'in_progress');

    try {
      // Generate a new title
      const newTitle = await generateTitle(chatMessages);

      // Only update if we got a non-default title
      if (newTitle !== 'New Chat') {
        console.log(`[API] Updating chat title to: ${newTitle}`);
        await updateChat(newTitle);
        console.log(`[API] Chat title updated successfully`);
        localStorage.setItem(titleUpdateKey, 'completed');
      } else {
        console.log(`[API] Generated title was default, not updating`);
        // Mark as completed anyway to prevent further attempts
        localStorage.setItem(titleUpdateKey, 'completed');
      }
    } catch (error) {
      console.error(`[API] Error updating title:`, error);
      // Remove the in_progress flag so we can try again later
      localStorage.removeItem(titleUpdateKey);
    }
  }, [chat, generateTitle, updateChat, initialMessages]);

  // Save message to chat - modified to update cache
  const saveMessage = async (message: Message) => {
    console.log('[CHAT] saveMessage called with:', message.id, message.role);

    // Ensure the message has a valid role
    if (!message.role || (message.role !== 'user' && message.role !== 'assistant' && message.role !== 'system')) {
      console.error('[CHAT] Invalid message role:', message.role);
      message.role = message.role || 'user'; // Default to user if missing
    }

    // Log the full message for debugging
    console.log('[DEBUG-MESSAGES] Saving message:', {
      id: message.id,
      role: message.role,
      content: message.content.substring(0, 50) + '...'
    });

    // Check if this message already exists in our messages array
    const messageExists = messages.some(m => m.id === message.id);
    if (messageExists) {
      console.log('[CHAT] Message already exists in state, skipping save:', message.id);
      return;
    }

    // Check if this message is already being saved (globally)
    if (pendingRequests.saveMessage.has(message.id)) {
      console.log(`[CHAT] Already saving message ${message.id}, skipping duplicate request`);
      return;
    }

    // Mark this message as being saved
    pendingRequests.saveMessage.add(message.id);
    setIsLoading(true);

    try {
      // Add message to local state first for immediate UI update
      const updatedMessages = [...messages, message];
      setMessages(updatedMessages);

      if (chat) {
        // If chat exists, save message to it
        console.log(`[CHAT] Saving message ${message.id} to existing chat ${chat.id}`);

        const response = await fetch(`/api/chats/${chat.id}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to save message');
        }

        // Update cache with new message
        if (chatDataCache[chat.id]) {
          chatDataCache[chat.id] = {
            ...chatDataCache[chat.id],
            messages: updatedMessages,
            timestamp: Date.now()
          };
        }

        // Update title if needed
        await updateTitleBasedOnMessages(updatedMessages);
      } else {
        // If no chat exists, create a new one with this message
        console.log(`[CHAT] No chat exists, creating new chat with message ${message.id}`);
        const newChatId = await createChat('New Chat', [...initialMessages, message]);
        console.log(`[CHAT] Created new chat with ID: ${newChatId}`);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving message');
      console.error('[CHAT] Save message error:', err);
      toast({
        title: 'Failed to save message',
        description: err.message || 'An error occurred while saving message',
        variant: 'destructive',
      });
    } finally {
      // Remove this message from the pending requests
      pendingRequests.saveMessage.delete(message.id);
      setIsLoading(false);
    }
  };

  // Other methods (updateChat, generateTitle, etc.) should be similarly modified
  // to update the cache when they change chat data

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
