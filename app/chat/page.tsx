"use client";

import type React from "react";

import { useState, useRef, useEffect, useMemo } from "react";
import AppLayout from "@/components/app-layout";
import { AnimatedButton } from "@/components/ui/animated-button";
import AnimatedElement from "@/components/animated-element";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TokenUsage } from "@/components/token-usage";
import { extractTextFromPdf } from "@/lib/pdf-worker";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";
import { AudioPlayer } from "@/components/chat/audio-player";
import {
  AlertCircle,
  FileText,
  Mic,
  Paperclip,
  Send,
  Video,
  X,
  MessageSquare,
  ThumbsUp,
  Coins,
  Info,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";
import { useGemini } from "@/hooks/use-gemini";
// import { cn } from "@/lib/utils" // Kept for future use
import { ErrorMessage } from "@/components/chat/error-message";
import { LoadingSpinner } from "@/components/chat/loading-spinner";
import { SuggestedPrompts } from "@/components/chat/suggested-prompts";
import { ChatSearch } from "@/components/chat/chat-search";
import { ChatMessage } from "@/components/chat/chat-message";
import { useChatErrors } from "@/hooks/use-chat-errors";
import { useFileProcessing } from "@/hooks/use-file-processing";
import { useFileValidation } from "@/hooks/use-file-validation";
import { useTokenUsage } from "@/hooks/use-token-usage";
import { useChat } from "@/contexts/chat-context";
import { Message } from "@/types";
// Token manager imports removed - not used

// ErrorState interface removed - not used

export default function ChatPage() {
  console.log("[CHAT-PAGE] ChatPage component rendering");

  // Log when the component mounts
  useEffect(() => {
    console.log("[CHAT-PAGE] ChatPage component mounted");
    return () => {
      console.log("[CHAT-PAGE] ChatPage component unmounting");
    };
  }, []);

  // Initialize toast
  const { toast } = useToast();

  // Initialize with a welcome message if no chat is loaded
  const initialMessages = [
    {
      id: "welcome",
      role: "assistant" as const,
      content:
        "Hi there! I'm your AI sales coach. You can chat with me about sales techniques, upload sales calls for analysis, or practice your pitch. How can I help you today?",
    },
  ];

  // Use the chat context to manage messages
  const {
    messages: storedMessages,
    saveMessage,
    isLoading: chatLoading,
    createChat,
    chat,
    currentChatId,
  } = useChat();

  console.log(
    "Chat context loaded with messages:",
    storedMessages?.length || 0
  );

  // Log the loaded chat for debugging
  useEffect(() => {
    if (chat) {
      console.log("Chat loaded in main UI:", chat);
    }
  }, [chat]);

  // Use Gemini for AI responses
  const {
    sendMessage: sendGeminiMessage,
    analyzeContent: analyzeContentWithGemini,
  } = useGemini({
    initialMessages,
  });

  // Use storedMessages directly from the chat context instead of maintaining a separate state
  // This prevents unnecessary re-renders and potential infinite loops
  const messages = useMemo(() => {
    console.log(
      "[DEBUG-MESSAGES] Computing messages from storedMessages:",
      storedMessages.length > 0
        ? `Using ${storedMessages.length} stored messages`
        : `Using ${initialMessages.length} initial messages`
    );

    if (storedMessages.length > 0) {
      // Log the roles of messages to debug user message display issues
      console.log(
        "[DEBUG-MESSAGES] Message roles:",
        storedMessages
          .map((m) => `${m.id.substring(0, 8)}:${m.role}`)
          .join(", ")
      );
    }

    return storedMessages.length > 0 ? storedMessages : initialMessages;
  }, [storedMessages, initialMessages]);

  // Log when messages change for debugging
  useEffect(() => {
    console.log("[DEBUG-MESSAGES] Messages updated, count:", messages.length);
    if (messages.length > 0) {
      console.log(
        "[DEBUG-MESSAGES] First few messages:",
        messages.slice(0, 3).map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content.substring(0, 30) + "...",
        }))
      );
    }
  }, [messages]);

  const [input, setInput] = useState("");
  const [recordingComplete, setRecordingComplete] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);

  // Audio recorder hook
  const {
    isRecording,
    recordingDuration,
    startRecording,
    stopRecording,
    cancelRecording: cancelAudioRecording,
    // recordingBlob is handled in onRecordingComplete
    error: recordingError,
  } = useAudioRecorder({
    onRecordingComplete: (blob, duration) => {
      console.log(
        `Recording complete: ${duration}s, blob size: ${blob.size} bytes`
      );
      setAudioBlob(blob);
      setShowAudioPlayer(true);
      setRecordingComplete(true);

      // Create a File object from the Blob
      try {
        if (blob.size > 0) {
          // Determine the correct file extension and MIME type based on the blob type
          let fileExtension = "webm";
          let mimeType = "audio/webm";

          if (blob.type) {
            console.log(`Detected blob type: ${blob.type}`);
            if (blob.type.includes("mp3") || blob.type.includes("mpeg")) {
              fileExtension = "mp3";
              mimeType = "audio/mpeg";
            } else if (blob.type.includes("ogg")) {
              fileExtension = "ogg";
              mimeType = "audio/ogg";
            } else if (blob.type.includes("wav")) {
              fileExtension = "wav";
              mimeType = "audio/wav";
            }
            console.log(
              `Using file extension: ${fileExtension}, MIME type: ${mimeType}`
            );
          }

          const file = new File([blob], `recorded_audio.${fileExtension}`, {
            type: mimeType,
          });

          console.log(
            `Created file from blob, size: ${file.size} bytes, type: ${file.type}`
          );
          setSelectedFile(file);
        }
      } catch (error) {
        console.error("Error creating file from audio blob:", error);
        toast({
          title: "Recording Error",
          description: "Failed to process the recorded audio.",
          variant: "destructive",
        });
      }
    },
  });

  // Handle recording errors
  useEffect(() => {
    if (recordingError) {
      console.error("Recording error:", recordingError);
      toast({
        title: "Recording Error",
        description: recordingError,
        variant: "destructive",
      });
    }
  }, [recordingError, toast]);
  // Combine loading states
  const [isLoading, setIsLoading] = useState(false);

  // Update loading state when chat loading state changes
  useEffect(() => {
    setIsLoading(chatLoading);
  }, [chatLoading]);

  // Create a new chat if we're on the main chat page and no chat is loaded
  // Using a ref to track if we've already tried to initialize a chat
  const chatInitializedRef = useRef<boolean>(false);
  const initializationAttemptedRef = useRef<boolean>(false);

  // Add a ref to track component mount status
  const isMountedRef = useRef<boolean>(false);

  // Use localStorage to track if we've already created an initial chat in this session
  useEffect(() => {
    console.log("[DEBUG-API-CALLS] Chat initialization effect triggered");

    // Skip if we've already attempted initialization in this component instance
    if (initializationAttemptedRef.current) {
      console.log(
        "[DEBUG-API-CALLS] Initialization already attempted, skipping"
      );
      return;
    }

    // Check if this is the first mount
    if (isMountedRef.current) {
      console.log("[DEBUG-API-CALLS] Not first mount, skipping initialization");
      return;
    }

    // Mark that component is mounted and initialization attempted
    isMountedRef.current = true;
    initializationAttemptedRef.current = true;
    console.log("[DEBUG-API-CALLS] Starting chat initialization");

    const initializeChat = async () => {
      // Check if we've already initialized a chat in this session
      const initialChatCreated = localStorage.getItem("initial_chat_created");

      // If we've already tried to initialize a chat, don't try again
      if (chatInitializedRef.current || initialChatCreated === "true") {
        console.log("[API] Chat already initialized, skipping");
        return;
      }

      console.log(
        "[API] ChatPage - Checking if we need to initialize a chat:",
        "currentChatId:",
        currentChatId,
        "chat:",
        chat ? "exists" : "null",
        "storedMessages.length:",
        storedMessages.length
      );

      // If we're on the main chat page (not a specific chat) and there are no messages
      // other than the initial welcome message, and no chat is loaded, create a new chat
      if (!currentChatId && !chat && storedMessages.length <= 1) {
        try {
          console.log("[API] ChatPage - Creating new chat...");
          chatInitializedRef.current = true;

          // Mark that we've created an initial chat in this session
          localStorage.setItem("initial_chat_created", "true");

          // Create a new chat with the welcome message
          await createChat("New Chat", initialMessages);
          console.log("[API] ChatPage - New chat created successfully");
        } catch (error) {
          console.error("[API] ChatPage - Error creating initial chat:", error);
          // Reset the flag so we can try again on next page load
          localStorage.removeItem("initial_chat_created");
        }
      } else {
        // Mark as initialized if we don't need to create a chat
        chatInitializedRef.current = true;
        localStorage.setItem("initial_chat_created", "true");
        console.log("[API] ChatPage - No need to create a new chat");
      }
    };

    // Use setTimeout to break potential circular dependencies
    console.log("[DEBUG-API-CALLS] Setting up initialization timeout");
    const timeoutId = setTimeout(() => {
      console.log("[DEBUG-API-CALLS] Timeout fired, calling initializeChat()");
      initializeChat();
    }, 1000);

    // Clean up the timeout if the component unmounts
    return () => {
      console.log("[DEBUG-API-CALLS] Cleaning up initialization timeout");
      clearTimeout(timeoutId);
    };
  }, []); // Empty dependency array - only run once on mount

  // Track all dependency changes in a single effect to see the sequence
  const depsRef = useRef({
    currentChatId: null as string | null,
    chatId: null as string | null,
    messagesLength: 0,
    renderCount: 0,
  });

  // Increment render count on each render
  depsRef.current.renderCount++;

  useEffect(() => {
    // Only log if something actually changed
    const hasChanges =
      depsRef.current.currentChatId !== currentChatId ||
      chat?.id !== depsRef.current.chatId ||
      depsRef.current.messagesLength !== storedMessages.length;

    if (hasChanges) {
      console.log("[DEBUG-API-CALLS] Dependencies changed:", {
        renderCount: depsRef.current.renderCount,
        currentChatId: {
          from: depsRef.current.currentChatId,
          to: currentChatId,
        },
        chat: {
          from: depsRef.current.chatId,
          to: chat?.id || null,
        },
        messagesLength: {
          from: depsRef.current.messagesLength,
          to: storedMessages.length,
        },
      });

      // Update the ref with current values
      depsRef.current.currentChatId = currentChatId;
      depsRef.current.chatId = chat?.id || null;
      depsRef.current.messagesLength = storedMessages.length;
    }
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Token usage tracking
  const { tokenUsage, addTokenUsage } = useTokenUsage({
    sessionId: "chat-session",
  });

  // Token limit and usage from user's subscription
  const [tokenStats, setTokenStats] = useState<{
    tokenLimit: number;
    tokensUsed: number;
    tokensRemaining: number;
    percentageUsed: number;
  }>({
    tokenLimit: 100000, // Default value
    tokensUsed: 0,
    tokensRemaining: 100000,
    percentageUsed: 0,
  });

  // Fetch token stats from user's subscription
  useEffect(() => {
    const fetchTokenStats = async () => {
      try {
        // Get the user's token usage stats
        const response = await fetch("/api/token-usage/stats");
        if (response.ok) {
          const data = await response.json();
          setTokenStats({
            tokenLimit: data.tokenLimit || 100000,
            tokensUsed: data.tokensUsed || 0,
            tokensRemaining: data.tokensRemaining || 100000,
            percentageUsed: data.percentageUsed || 0,
          });
        }
      } catch (error) {
        console.error("Error fetching token stats:", error);
      }
    };

    fetchTokenStats();

    // Set up interval to refresh token stats every minute
    const intervalId = setInterval(fetchTokenStats, 60000);

    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, []);

  // Search functionality
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Message[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { error, handleFileError, handleMessageError, clearError } =
    useChatErrors();
  const {
    isProcessing,
    uploadProgress,
    uploading,
    error: processingError,
    startProcessing,
    updateProgress,
    finishProcessing,
    setError: setProcessingError,
    reset: resetProcessing,
  } = useFileProcessing();
  const { validateFile, getFileType } = useFileValidation();
  const [showAnalysisDialog, setShowAnalysisDialog] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<Message | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastMessageCountRef = useRef<number>(0);

  // Enhanced scrolling functionality with threshold detection
  useEffect(() => {
    // Only scroll if we have messages and the count has changed
    if (messages.length > 0 && messages.length !== lastMessageCountRef.current) {
      console.log(`Messages count changed from ${lastMessageCountRef.current} to ${messages.length}`);

      // Update the reference count
      lastMessageCountRef.current = messages.length;

      // Use setTimeout to ensure the DOM has updated with the new messages
      setTimeout(() => {
        // Get the container and the last message element
        const container = messagesContainerRef.current;
        const lastMessage = messagesEndRef.current;

        if (container && lastMessage) {
          // Calculate if the last message is below the visible area
          const containerRect = container.getBoundingClientRect();
          const lastMessageRect = lastMessage.getBoundingClientRect();

          // Check if the last message is below the visible area
          const isBelowVisibleArea = lastMessageRect.bottom > containerRect.bottom;

          if (isBelowVisibleArea) {
            console.log("Message is below visible area, scrolling to make it visible");

            // Scroll to position the message at the top of the visible area
            lastMessage.scrollIntoView({
              behavior: "smooth",
              block: "start" // Position at the top of the visible area
            });
          } else {
            // If not below visible area, just scroll to the bottom as usual
            lastMessage.scrollIntoView({
              behavior: "smooth",
              block: "end"
            });
          }

          console.log("Scrolled to make message visible");
        }
      }, 100); // Small delay to ensure DOM update
    }
  }, [messages]);

  // Search function
  const handleSearch = (query: string) => {
    if (!query.trim()) {
      clearSearch();
      return;
    }

    setIsSearching(true);
    setSearchQuery(query);

    console.log("Searching for:", query, "in", messages.length, "messages");

    // Enhanced search implementation
    const results = messages.filter((message: Message) => {
      // Skip system messages or empty content
      if (!message.content || message.role === "system") {
        return false;
      }

      // Check if the message content includes the query (case insensitive)
      const contentMatch = message.content
        .toLowerCase()
        .includes(query.toLowerCase());

      // If there's an attachment, also check its name or type
      const attachmentMatch = message.attachmentName
        ? message.attachmentName.toLowerCase().includes(query.toLowerCase())
        : false;

      return contentMatch || attachmentMatch;
    });

    console.log("Search results:", results.length);
    setSearchResults(results);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setIsSearching(false);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleSendMessage = async (e: React.FormEvent | string) => {
    // Handle both form events and direct string inputs
    let messageContent = input;

    if (typeof e === "object") {
      e.preventDefault();
      // Using the input state value
    } else if (typeof e === "string") {
      // Using the provided string directly
      messageContent = e;
    }

    if ((!messageContent.trim() && !selectedFile) || isLoading || isProcessing)
      return;

    clearError();
    startProcessing();

    // Create a unique ID with a timestamp prefix for proper sorting
    const now = new Date();
    const timestamp = now.getTime() * 1000 + Math.floor(Math.random() * 1000);
    const messageId = `msg_${timestamp}_${Math.random()
      .toString(36)
      .substring(2, 9)}`;

    console.log(
      `Generated message ID: ${messageId} with timestamp ${timestamp}`
    );

    let userMessage: Message = {
      id: messageId,
      role: "user", // Explicitly set role to "user"
      content: messageContent,
    };

    // Log the user message for debugging
    console.log("[DEBUG-MESSAGES] Creating user message:", {
      id: userMessage.id,
      role: userMessage.role,
      content: userMessage.content.substring(0, 50) + "...",
    });

    // Log the message being sent
    console.log("Sending user message:", userMessage.id);

    if (selectedFile) {
      // Validate file
      const validationError = validateFile(selectedFile);
      if (validationError) {
        handleFileError(new Error(validationError.message), () => {
          setSelectedFile(null);
          resetProcessing();
        });
        return;
      }

      const fileType = getFileType(selectedFile);
      userMessage = {
        ...userMessage,
        attachmentType: fileType,
        attachmentName: selectedFile.name,
        content:
          input ||
          `I've uploaded a ${fileType} file for analysis: ${selectedFile.name}`,
      };

      // We no longer need to update the UI directly since we're using the chat context
      // The UI will update automatically when we save the message to storage

      try {
        let fileContent = "";

        if (selectedFile.type === "application/pdf") {
          try {
            // Extract text from PDF using our utility function
            fileContent = await extractTextFromPdf(selectedFile);
            // Update progress to show user something is happening
            updateProgress(75);
          } catch (error) {
            console.error("PDF processing error:", error);
            fileContent =
              "[PDF content could not be extracted. Processing as a binary file.]";
            // Update progress to show user something is happening
            updateProgress(50);
            // Set a more specific error message
            setProcessingError(
              "PDF processing error: The file might be corrupted or password-protected."
            );
          }
        } else if (fileType === "audio" || fileType === "video") {
          try {
            // For audio and video files, we'll send them to the server for transcription with Deepgram
            // Create a FormData object to send the file
            const formData = new FormData();
            formData.append("file", selectedFile);
            // No need to append fileType for Deepgram as it detects the type from the file itself

            // Show a detailed processing message
            if (fileType === "video") {
              setProcessingError(
                `Processing video: extracting audio and transcribing content. This may take a moment...`
              );
            } else {
              setProcessingError(
                `Transcribing ${fileType} content. This may take a moment...`
              );
            }

            // Update progress to show we're starting the transcription process
            updateProgress(20);

            // Set up a progress simulation for better UX
            let currentProgress = 20;
            const progressInterval = setInterval(() => {
              // Simulate progress up to 90% (leave room for final steps)
              currentProgress = Math.min(
                currentProgress + Math.random() * 3,
                90
              );
              updateProgress(currentProgress);
            }, 1000);

            let responseData;
            try {
              // Send the file to the server for transcription using Deepgram
              const response = await fetch("/api/transcribe/deepgram", {
                method: "POST",
                body: formData,
              });

              // Clear the progress interval
              clearInterval(progressInterval);

              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                  errorData.error ||
                    `Failed to transcribe ${fileType} file. Server returned ${response.status}`
                );
              }

              // Set progress to 95% to indicate we're almost done
              updateProgress(95);

              // Get the response data
              responseData = await response.json();
            } catch (error) {
              // Clear the progress interval if there's an error
              clearInterval(progressInterval);
              throw error;
            }

            // Validate the transcript content for Deepgram response
            if (
              !responseData?.success ||
              !responseData?.transcript?.text ||
              responseData.transcript.text.trim() === ""
            ) {
              console.warn("Received empty or undefined transcript from Deepgram API");
              fileContent = `[${fileType.toUpperCase()} content could not be transcribed]`;
            } else {
              console.log(
                "Deepgram transcript received successfully:",
                responseData.transcript.text.substring(0, 100) + "..."
              );
              fileContent = responseData.transcript.text;

              // Update the user message to include the transcript
              userMessage.content = `I've uploaded a ${fileType} file for analysis: ${selectedFile.name}\n\nTranscript:\n${fileContent.substring(0, 1000)}${fileContent.length > 1000 ? '...' : ''}`;
            }

            // Show success message with Deepgram
            setProcessingError(
              `Successfully transcribed ${fileType} content using Deepgram. Analyzing...`
            );

            // Track token usage for Deepgram
            // Token usage is already tracked in the Deepgram API route
            console.log("Token usage for Deepgram transcription is tracked in the API route");

            // Update progress
            updateProgress(80);
          } catch (error) {
            console.error("Media file processing error:", error);

            // Provide more specific error messages based on the error
            let errorMessage = `Failed to transcribe ${fileType} file. The file might be corrupted or in an unsupported format.`;

            if (error instanceof Error) {
              if (error.message.includes("Deepgram")) {
                errorMessage = `Deepgram transcription failed. Please try a different ${fileType} file or format.`;
              } else if (error.message.includes("extract audio")) {
                errorMessage = `Could not extract audio from video. Please try a different video format or upload an audio file directly.`;
              } else if (error.message.includes("file size")) {
                errorMessage = `File is too large. Please upload a smaller file (max 50MB).`;
              } else if (error.message.includes("Invalid file type")) {
                errorMessage = `Unsupported file format. Please upload a supported audio or video format (WAV, MP3, MP4, WebM, OGG).`;
              }
            }

            setProcessingError(errorMessage);

            // Show toast notification for better visibility
            toast({
              title: `${
                fileType.charAt(0).toUpperCase() + fileType.slice(1)
              } Processing Error`,
              description: errorMessage,
              variant: "destructive",
            });

            handleFileError(error, () => {
              setSelectedFile(null);
              resetProcessing();
            });
            return;
          }
        }

        // User message is already added to the UI at the beginning of the function
        // Save the user message to storage
        await saveMessage(userMessage);
        setInput("");
        setSelectedFile(null);
        setRecordingComplete(false);
        setIsLoading(true);

        // We'll use a local loading state instead of modifying the messages
        // This avoids issues with the chat context
        setIsLoading(true);

        try {
          const analysisMessage = await analyzeContentWithGemini(
            fileType,
            fileContent,
            selectedFile.name,
            input
          );

          // Save the analysis message to storage
          await saveMessage(analysisMessage);

          // Scroll to make the analysis message visible
          setTimeout(() => {
            if (messagesEndRef.current) {
              messagesEndRef.current.scrollIntoView({
                behavior: "smooth",
                block: "end"
              });
              console.log("Scrolled to new analysis message");
            }
          }, 100);

          setCurrentAnalysis(analysisMessage);
          setShowAnalysisDialog(true);

          // Track token usage if available
          if (analysisMessage.tokenUsage) {
            addTokenUsage({
              promptTokens: analysisMessage.tokenUsage.promptTokens,
              completionTokens: analysisMessage.tokenUsage.completionTokens,
              totalTokens: analysisMessage.tokenUsage.totalTokens,
              estimatedCost: 0, // Will be calculated by the hook
              model: "gemini-pro-vision", // Using vision model for content analysis
            });
          }
        } catch (error) {
          // Handle the error
          handleFileError(error, () => {
            setSelectedFile(null);
            resetProcessing();
          });
        } finally {
          setIsLoading(false);
          finishProcessing();
        }
      } catch (error) {
        handleFileError(error, () => {
          setSelectedFile(null);
          resetProcessing();
        });
      }
    } else {
      // Save the user message to storage first
      console.log("Saving user message to storage:", userMessage.id);
      try {
        // This will add the message to the database and update storedMessages
        console.log("About to save user message with role:", userMessage.role);
        await saveMessage(userMessage);
        console.log(
          "User message saved successfully, current messages count:",
          messages.length
        );

        // Immediately scroll to make the new message visible
        setTimeout(() => {
          if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({
              behavior: "smooth",
              block: "end"
            });
            console.log("Scrolled to new user message");
          }
        }, 50);

        // Force a log of all current messages for debugging
        console.log(
          "Current messages after saving user message:",
          messages.map((m) => `${m.id.substring(0, 8)}:${m.role}`).join(", ")
        );
      } catch (error) {
        console.error("Error saving user message:", error);
        toast({
          title: "Error",
          description: "Failed to save your message. Please try again.",
          variant: "destructive",
        });
        finishProcessing();
        return;
      }

      setInput("");
      setIsLoading(true);

      // Set loading state to show a loading indicator
      console.log("Setting loading state to true");
      setIsLoading(true);

      try {
        // Send the message to Gemini and get the response
        const result = await sendGeminiMessage(messageContent);

        // Save the AI response to storage
        // This will update storedMessages and trigger the useEffect
        await saveMessage(result);
        console.log("AI response saved successfully:", result.id);

        // Scroll to make the AI response visible
        setTimeout(() => {
          if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({
              behavior: "smooth",
              block: "end"
            });
            console.log("Scrolled to new AI response");
          }
        }, 100);

        // Track token usage if available
        if (result.tokenUsage) {
          addTokenUsage({
            promptTokens: result.tokenUsage.promptTokens,
            completionTokens: result.tokenUsage.completionTokens,
            totalTokens: result.tokenUsage.totalTokens,
            estimatedCost: 0, // Will be calculated by the hook
            model: "gemini-pro",
          });
        }
      } catch (error) {
        console.error("Error getting AI response:", error);

        // Show error message to user
        toast({
          title: "Error",
          description: "Failed to get a response. Please try again.",
          variant: "destructive",
        });

        handleMessageError(() => {
          setIsLoading(false);
        });
      } finally {
        setIsLoading(false);
        finishProcessing();
      }
    }
  };

  // generateAnalysisMessage function removed - not used

  const toggleRecording = async () => {
    if (!isRecording) {
      // Check if browser supports MediaRecorder
      if (typeof window !== "undefined" && !window.MediaRecorder) {
        console.error("MediaRecorder is not supported in this browser");
        toast({
          title: "Recording Not Supported",
          description:
            "Your browser does not support audio recording. Please try a different browser like Chrome or Firefox.",
          variant: "destructive",
        });
        return;
      }

      // Check if user has granted microphone permissions
      try {
        const permissionStatus = await navigator.permissions.query({
          name: "microphone" as PermissionName,
        });
        console.log("Microphone permission status:", permissionStatus.state);

        if (permissionStatus.state === "denied") {
          toast({
            title: "Microphone Access Denied",
            description:
              "Please allow microphone access in your browser settings to record audio.",
            variant: "destructive",
          });
          return;
        }
      } catch (error) {
        console.log("Could not check microphone permission:", error);
        // Continue anyway as some browsers don't support the permissions API
      }

      // Start recording
      setRecordingComplete(false);
      setShowAudioPlayer(false);
      setAudioBlob(null);
      setSelectedFile(null); // Clear any previously selected file

      try {
        console.log("Attempting to start recording...");
        await startRecording();
        console.log("Recording started successfully");

        // Show a toast to indicate recording has started
        toast({
          title: "Recording Started",
          description:
            'Speak clearly into your microphone. Click "Done" when finished.',
        });
      } catch (error) {
        console.error("Error starting recording:", error);

        // Provide more specific error messages based on the error
        let errorMessage =
          "Failed to start recording. Please check your microphone permissions.";

        if (error instanceof Error) {
          if (
            error.message.includes("Permission denied") ||
            error.message.includes("NotAllowedError")
          ) {
            errorMessage =
              "Microphone access was denied. Please allow microphone access in your browser settings.";
          } else if (error.message.includes("NotFoundError")) {
            errorMessage =
              "No microphone found. Please connect a microphone and try again.";
          } else if (error.message.includes("NotReadableError")) {
            errorMessage =
              "Your microphone is busy or not working properly. Please try again.";
          }
        }

        toast({
          title: "Recording Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } else {
      // Stop recording
      try {
        console.log("Attempting to stop recording...");
        stopRecording();
        console.log("Recording stopped successfully");

        // Show a toast to indicate recording has stopped
        toast({
          title: "Recording Complete",
          description:
            'Your recording is ready. Click "Use Recording" to send it.',
        });
      } catch (error) {
        console.error("Error stopping recording:", error);

        // Provide more specific error messages based on the error
        let errorMessage = "Failed to stop recording.";

        if (error instanceof Error) {
          if (error.message.includes("No MediaRecorder")) {
            errorMessage =
              "Recording session was lost. Please try recording again.";
          } else if (error.message.includes("No audio data")) {
            errorMessage =
              "No audio was captured. Please check your microphone and try again.";
          }
        }

        toast({
          title: "Recording Error",
          description: errorMessage,
          variant: "destructive",
        });

        // Reset recording state
        cancelRecording();
      }
    }
  };

  const cancelRecording = () => {
    cancelAudioRecording();
    setRecordingComplete(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setRecordingComplete(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const renderFilePreview = () => {
    if (!selectedFile) return null;

    let icon = <FileText className="h-5 w-5 text-muted-foreground" />;
    if (selectedFile.type.startsWith("audio/")) {
      icon = <Mic className="h-5 w-5 text-muted-foreground" />;
    } else if (selectedFile.type.startsWith("video/")) {
      icon = <Video className="h-5 w-5 text-muted-foreground" />;
    }

    const isRecordedAudio =
      selectedFile.name === "recorded_audio.mp3" && recordingComplete;

    return (
      <AnimatedElement type="slide-up" duration={400}>
        {showAudioPlayer && audioBlob && isRecordedAudio && (
          <AudioPlayer
            audioBlob={audioBlob}
            className="mb-3"
            onConfirm={() => {
              try {
                if (!selectedFile) {
                  throw new Error("No audio file available");
                }

                console.log("Submitting form with recorded audio file");
                setShowAudioPlayer(false);

                // Set a default message if none is provided
                if (!input.trim()) {
                  setInput("Here's a voice recording I'd like to transcribe.");
                }

                // Add a small delay to ensure the input state is updated
                setTimeout(() => {
                  // Process the file by triggering the form submission
                  handleSendMessage(new Event("submit") as any);
                }, 100);
              } catch (error) {
                console.error("Error processing audio file:", error);
                toast({
                  title: "Recording Error",
                  description:
                    error instanceof Error
                      ? error.message
                      : "Failed to process the recorded audio.",
                  variant: "destructive",
                });
              }
            }}
            onCancel={() => {
              setShowAudioPlayer(false);
              setSelectedFile(null);
              resetProcessing();
              cancelAudioRecording();
            }}
          />
        )}
        {processingError && (
          <div className="flex items-center gap-2 p-3 border border-destructive rounded-xl bg-destructive/10 mb-3">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <p className="text-sm text-destructive">{processingError}</p>
            <AnimatedButton
              variant="ghost"
              size="icon"
              className="h-7 w-7 ml-auto rounded-full hover:bg-destructive/20"
              onClick={() => resetProcessing()}
              animation="shake"
            >
              <X className="h-3.5 w-3.5" />
            </AnimatedButton>
          </div>
        )}
        <div className="flex items-center gap-2 p-3 border rounded-xl bg-accent/30 mb-3 hover:shadow-md transition-all duration-300">
          <div className="p-2 bg-primary/10 rounded-full">{icon}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{selectedFile.name}</p>
            <p className="text-xs text-muted-foreground">
              {isRecordedAudio
                ? `${formatDuration(recordingDuration)} recording`
                : `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`}
            </p>
          </div>
          {uploading ? (
            <div className="w-20">
              <Progress
                value={uploadProgress}
                className="h-1.5 rounded-full bg-secondary"
              />
            </div>
          ) : (
            <AnimatedButton
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full hover:bg-accent/50"
              onClick={clearSelectedFile}
              animation="shake"
            >
              <X className="h-3.5 w-3.5" />
            </AnimatedButton>
          )}
        </div>
      </AnimatedElement>
    );
  };

  const renderMessage = (message: Message) => {
    console.log(
      "Rendering message:",
      message.id,
      message.role,
      "isUser check:",
      message.role === "user",
      "ID starts with msg_:",
      message.id.startsWith("msg_"),
      "Content:",
      message.content.substring(0, 30) + "..."
    );

    // Ensure the message has a valid role
    let validatedMessage = { ...message };

    // If the role is missing or invalid, determine it based on the message ID
    if (
      !validatedMessage.role ||
      (validatedMessage.role !== "user" &&
        validatedMessage.role !== "assistant" &&
        validatedMessage.role !== "system")
    ) {
      // Messages with IDs starting with 'msg_' are typically user messages
      if (validatedMessage.id.startsWith("msg_")) {
        validatedMessage.role = "user";
      } else {
        validatedMessage.role = "assistant";
      }
      console.log(
        `Fixed invalid role for message ${validatedMessage.id}, set to ${validatedMessage.role}`
      );
    }

    return (
      <ChatMessage
        key={validatedMessage.id}
        message={validatedMessage}
        isLoading={isLoading}
        onShowPerformance={(msg: Message) => setCurrentAnalysis(msg)}
      />
    );
  };

  const renderAnalysisDialog = () => {
    if (!currentAnalysis || !currentAnalysis.performanceData) return null;

    const { overallScore, metrics, strengths, improvements } =
      currentAnalysis.performanceData;

    return (
      <Dialog open={showAnalysisDialog} onOpenChange={setShowAnalysisDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl border-primary/20 bg-card/95 backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
              Performance Analysis
            </DialogTitle>
            <DialogDescription>
              Detailed breakdown of your sales performance
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="overview" className="mt-4">
            <TabsList className="grid w-full grid-cols-3 rounded-full p-1 bg-accent">
              <TabsTrigger
                value="overview"
                className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-white"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="metrics"
                className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-white"
              >
                Metrics
              </TabsTrigger>
              <TabsTrigger
                value="recommendations"
                className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-white"
              >
                Recommendations
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-6">
              <div className="flex flex-col items-center justify-center p-6 border border-primary/20 rounded-xl bg-accent/30 backdrop-blur-sm animate-pulse-glow">
                <div className="text-5xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
                  {overallScore}/100
                </div>
                <p className="text-muted-foreground">
                  Overall Performance Score
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <Card className="border-green-500/20 bg-green-500/5 overflow-hidden">
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-3 flex items-center text-green-400">
                      <ThumbsUp className="h-4 w-4 mr-2" />
                      Strengths
                    </h3>
                    <ul className="space-y-2">
                      {strengths.map((strength, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-green-400 mr-2">✓</span>
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-amber-500/20 bg-amber-500/5 overflow-hidden">
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-3 flex items-center text-amber-400">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Areas to Improve
                    </h3>
                    <ul className="space-y-2">
                      {improvements.map((improvement, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-amber-400 mr-2">!</span>
                          {improvement}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="metrics" className="space-y-4 mt-6">
              {metrics.map((metric, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{metric.name}</span>
                    <span className="font-semibold">{metric.score}/100</span>
                  </div>
                  <div className="relative pt-1">
                    <div className="overflow-hidden h-2 text-xs flex rounded-full bg-secondary">
                      <div
                        style={{ width: `${metric.score}%` }}
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center rounded-full bg-gradient-to-r from-primary to-purple-400 transition-all duration-1000"
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-4 mt-6">
              <Textarea
                className="min-h-[200px] rounded-xl bg-accent/30 border-primary/20 focus-visible:ring-primary"
                readOnly
                value={`Based on my analysis, here are some specific recommendations to improve your sales performance:

1. ${improvements[0]}
   - Try acknowledging customer concerns before addressing them
   - Focus on value proposition rather than defending price points
   - Use social proof to validate your offering

2. ${improvements[1] || "Work on your closing techniques"}
   - Practice more direct closing questions
   - Offer specific next steps at the end of your conversations
   - Create a sense of urgency when appropriate

Continue building on your strengths:
- ${strengths[0]}
- ${strengths[1] || "Your clear communication style"}

I recommend practicing these techniques in our chat interface. Would you like to role-play a scenario to practice these skills?`}
              />
              <AnimatedButton
                variant="gradient"
                className="w-full gap-2"
                animation="pulse"
                ripple
                onClick={() => {
                  // Close the dialog
                  setShowAnalysisDialog(false);

                  // Send a practice request message
                  const practiceMessage = {
                    id: Date.now().toString(),
                    role: "user",
                    content:
                      "I want to practice my sales skills. Can you set up a role-play scenario based on your recommendations?",
                  };

                  // Save the message and trigger AI response
                  handleSendMessage(practiceMessage.content);
                }}
              >
                <MessageSquare className="h-4 w-4" />
                Practice with AI Coach
              </AnimatedButton>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    );
  };

  // Suggested prompts moved to a separate component

  return (
    <AppLayout>
      <div className="container py-2 sm:py-4 md:py-6 max-w-5xl px-2 sm:px-4 h-full flex flex-col">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 sm:mb-4 gap-2">
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
            AI Sales Coach
          </h1>
          <div className="w-full sm:w-auto">
            <ChatSearch onSearch={handleSearch} onClear={clearSearch} />
          </div>
        </div>

        {/* Main content area with messages */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Message container with padding at the bottom to ensure space for the fixed input */}
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto pb-32 pr-4 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent"
          >
            {isSearching ? (
              <>
                <div className="p-2 mb-4 bg-accent/30 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Showing {searchResults.length} results for "{searchQuery}"
                  </p>
                </div>
                {searchResults.length > 0 ? (
                  // Sort search results the same way as regular messages
                  [...searchResults]
                    .sort((a, b) => {
                      // If messages have the same timestamp (from the ID), maintain original order
                      if (a.id === b.id) return 0;

                      // Extract timestamp from ID (assuming ID is timestamp-based)
                      const aTime = parseInt(a.id.replace(/\D/g, "")) || 0;
                      const bTime = parseInt(b.id.replace(/\D/g, "")) || 0;

                      // Sort by timestamp
                      return aTime - bTime;
                    })
                    .map(renderMessage)
                ) : (
                  <div className="p-4 text-center">
                    <p className="text-muted-foreground">
                      No messages found matching your search.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <>
                {messages.length > 0 ? (
                  // Log all messages before sorting for debugging
                  (console.log(
                    "Messages before sorting:",
                    messages.map((m) => ({
                      id: m.id,
                      role: m.role,
                      timestamp: m.id.startsWith("msg_")
                        ? m.id.split("_")[1]
                        : "n/a",
                      content: m.content.substring(0, 20) + "...",
                    }))
                  ),
                  (() => {
                    // Create a stable sort function for messages
                    const sortedMessages = [...messages].sort(
                      (a: Message, b: Message) => {
                        // If messages have the same ID, maintain original order
                        if (a.id === b.id) return 0;

                        // Special case for welcome message - always first
                        if (a.id === "welcome") return -1;
                        if (b.id === "welcome") return 1;

                        // Extract timestamp from ID for consistent sorting
                        const getTimestamp = (msg: Message) => {
                          // If the message has a createdAt date, use that
                          if (msg.createdAt) {
                            return new Date(msg.createdAt).getTime();
                          }

                          // Otherwise extract from ID
                          const id = msg.id;

                          // Handle different ID formats
                          if (id.startsWith("msg_")) {
                            const parts = id.split("_");
                            const timestamp = parts.length > 1 ? Number(parts[1]) : 0;
                            return isNaN(timestamp) ? 0 : timestamp;
                          } else if (id.includes("-")) {
                            // Format like "user-1234567890-abc"
                            const match = id.match(/[^-_]*(\d+)[^-_]*/);
                            return match ? parseInt(match[1]) : 0;
                          }

                          // For numeric IDs, use the ID directly
                          const numericId = Number(id);
                          return isNaN(numericId) ? 0 : numericId;
                        };

                        const aTime = getTimestamp(a);
                        const bTime = getTimestamp(b);

                        // Primary sort by timestamp
                        if (aTime !== bTime) {
                          return aTime - bTime;
                        }

                        // For loading messages, always put them at the end
                        if (a.id.startsWith("loading-")) return 1;
                        if (b.id.startsWith("loading-")) return -1;

                        // If all else is equal, sort by ID string
                        return a.id.localeCompare(b.id);
                      }
                    );

                    // Log the sorted messages
                    console.log(
                      "Sorted messages order:",
                      sortedMessages.map(
                        (m) => `${m.id.substring(0, 15)}:${m.role}`
                      )
                    );

                    // Return the sorted and rendered messages
                    return sortedMessages.map((message) =>
                      renderMessage(message)
                    );
                  })())
                ) : (
                  <div className="p-4 text-center">
                    <p className="text-muted-foreground">
                      No messages to display. Start a conversation!
                    </p>
                  </div>
                )}
                {error && (
                  <ErrorMessage
                    message={error.message}
                    onRetry={error.retry}
                    className="mt-4"
                  />
                )}
                {isLoading && (
                  <div className="flex items-center gap-2 p-4">
                    <LoadingSpinner text="Processing..." />
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          {messages.length === 1 && (
            <SuggestedPrompts onSelectPrompt={setInput} />
          )}
        </div>
      </div>

      {/* Fixed position input container at the bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-md border-t border-primary/10 z-10">
        <div className="container max-w-5xl mx-auto px-4 py-2">
          {renderFilePreview()}

          {/* Minimal Token Usage Display */}
          <div className="mb-1">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 cursor-help">
                        <Coins size={14} className="text-primary/70" />
                        <span className="text-xs text-muted-foreground">
                          {Math.round(tokenStats.percentageUsed)}% used
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <div className="space-y-1 text-xs">
                        <p>Session: {tokenUsage.session.totalTokens.toLocaleString()} tokens (${tokenUsage.session.estimatedCost.toFixed(4)})</p>
                        <p>Account: {tokenStats.tokensUsed.toLocaleString()} / {tokenStats.tokenLimit.toLocaleString()} tokens</p>
                        <p>{tokenStats.tokensRemaining.toLocaleString()} tokens remaining</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {/* Compact progress bar */}
              <div className="w-32 sm:w-48">
                <Progress
                  value={tokenStats.percentageUsed || 0}
                  className="h-1 bg-secondary/20"
                  style={
                    {
                      "--progress-value": `${tokenStats.percentageUsed || 0}%`,
                      "--progress-color":
                        (tokenStats.percentageUsed || 0) < 50
                          ? "var(--green-500)"
                          : (tokenStats.percentageUsed || 0) < 80
                          ? "var(--amber-500)"
                          : "var(--red-500)",
                    } as React.CSSProperties
                  }
                />
              </div>

              {tokenStats.percentageUsed > 80 && (
                <div className="flex items-center">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <AlertCircle size={14} className="text-red-500 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p className="text-xs">Approaching token limit</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}
            </div>
          </div>

          {/* Input form - always visible */}
          <AnimatedElement
            type="fade-in"
            duration={300}
            className="mb-2"
          >
            <form
              onSubmit={handleSendMessage}
              className="flex items-center gap-2 relative max-w-4xl mx-auto"
            >
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AnimatedButton
                      type="button"
                      variant={recordingComplete ? "gradient" : "outline"}
                      size="icon"
                      onClick={toggleRecording}
                      disabled={isLoading || !!selectedFile}
                      className="rounded-full w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0"
                      animation={recordingComplete ? "pulse" : "none"}
                    >
                      {recordingComplete ? (
                        <Mic className="h-4 w-4 text-white" />
                      ) : (
                        <Mic className="h-4 w-4" />
                      )}
                    </AnimatedButton>
                  </TooltipTrigger>
                  <TooltipContent>
                    {recordingComplete
                      ? "Recording complete"
                      : "Record audio"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AnimatedButton
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={triggerFileInput}
                      disabled={
                        isLoading || recordingComplete || !!selectedFile
                      }
                      className="rounded-full w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0"
                      animation="pop"
                    >
                      <Paperclip className="h-4 w-4" />
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept="audio/*,video/*,application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        onChange={handleFileSelect}
                      />
                    </AnimatedButton>
                  </TooltipTrigger>
                  <TooltipContent>
                    Upload file (audio, video, or document)
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Input
                placeholder={isLoading ? "AI is processing..." : "Type your message..."}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={false} // Never disable the input
                className="flex-1 rounded-full border-primary/20 focus-visible:ring-primary bg-accent/30 backdrop-blur-sm transition-all duration-300 hover:shadow-inner h-12 text-sm sm:text-base px-3 sm:px-4"
              />

              <AnimatedButton
                type="submit"
                size="icon"
                disabled={(!input.trim() && !selectedFile) || isLoading}
                variant="gradient"
                className="rounded-full w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0"
                animation="pop"
                ripple
              >
                {isLoading ? (
                  <LoadingSpinner size="sm" className="h-4 w-4" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </AnimatedButton>
            </form>
          </AnimatedElement>
        </div>
      </div>

      {renderAnalysisDialog()}
    </AppLayout>
  );
}
