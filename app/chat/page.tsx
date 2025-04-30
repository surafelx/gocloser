"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import AppLayout from "@/components/app-layout"
import { AnimatedButton } from "@/components/ui/animated-button"
import AnimatedElement from "@/components/animated-element"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TokenUsage } from "@/components/token-usage"
import { extractTextFromPdf } from "@/lib/pdf-worker"
import { useAudioRecorder } from "@/hooks/use-audio-recorder"
import { AudioPlayer } from "@/components/chat/audio-player"
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
  Clock,
  Coins,
  Info,
} from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/components/ui/use-toast"
import { useGemini } from "@/hooks/use-gemini"
// import { cn } from "@/lib/utils" // Kept for future use
import { ErrorMessage } from "@/components/chat/error-message"
import { LoadingSpinner } from "@/components/chat/loading-spinner"
import { SuggestedPrompts } from "@/components/chat/suggested-prompts"
import { ChatSearch } from "@/components/chat/chat-search"
import { ChatMessage } from "@/components/chat/chat-message"
import { useChatErrors } from "@/hooks/use-chat-errors"
import { useFileProcessing } from "@/hooks/use-file-processing"
import { useFileValidation } from "@/hooks/use-file-validation"
import { useTokenUsage } from "@/hooks/use-token-usage"
import { useChat } from "@/contexts/chat-context"
// Token manager imports removed - not used

interface Message {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  attachmentType?: "audio" | "video" | "text"
  attachmentName?: string
  isAnalysis?: boolean
  performanceData?: {
    overallScore: number
    metrics: {
      name: string
      score: number
    }[]
    strengths: string[]
    improvements: string[]
  }
  tokenUsage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

// ErrorState interface removed - not used

export default function ChatPage() {
  // Initialize toast
  const { toast } = useToast()

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
    currentChatId
  } = useChat()

  console.log('Chat context loaded with messages:', storedMessages?.length || 0)

  // Log the loaded chat for debugging
  useEffect(() => {
    if (chat) {
      console.log('Chat loaded in main UI:', chat);
    }
  }, [chat])

  // Use Gemini for AI responses
  const {
    sendMessage: sendGeminiMessage,
    analyzeContent: analyzeContentWithGemini,
  } = useGemini({
    initialMessages,
  })

  const [messages, setMessages] = useState<Message[]>(storedMessages.length > 0 ? storedMessages : initialMessages)

  // Keep messages in sync with stored messages
  useEffect(() => {
    console.log('Stored messages updated:', storedMessages.length, 'Current messages:', messages.length)

    // Find any user messages that might be in the current state but not in stored messages
    // This can happen when a user sends a message but it hasn't been saved to the server yet
    const pendingUserMessages = messages.filter(msg =>
      msg.role === 'user' && !storedMessages.some(sm => sm.id === msg.id)
    );

    console.log('Pending user messages:', pendingUserMessages.length);

    // Only update if we have stored messages, otherwise keep the initial welcome message
    if (storedMessages.length > 0) {
      // Combine stored messages with any pending user messages
      const combinedMessages = [...storedMessages, ...pendingUserMessages];
      console.log('Setting combined messages:', combinedMessages.length);
      setMessages(combinedMessages);
    }
  }, [storedMessages])

  const [input, setInput] = useState("")
  const [recordingComplete, setRecordingComplete] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [showAudioPlayer, setShowAudioPlayer] = useState(false)

  // Audio recorder hook
  const {
    isRecording,
    recordingDuration,
    startRecording,
    stopRecording,
    cancelRecording: cancelAudioRecording,
    recordingBlob,
    error: recordingError
  } = useAudioRecorder({
    onRecordingComplete: (blob, duration) => {
      console.log(`Recording complete: ${duration}s, blob size: ${blob.size} bytes`)
      setAudioBlob(blob)
      setShowAudioPlayer(true)
      setRecordingComplete(true)

      // Create a File object from the Blob
      try {
        if (blob.size > 0) {
          // Determine the correct file extension and MIME type based on the blob type
          let fileExtension = 'webm';
          let mimeType = 'audio/webm';

          if (blob.type) {
            if (blob.type.includes('mp3') || blob.type.includes('mpeg')) {
              fileExtension = 'mp3';
              mimeType = 'audio/mpeg';
            } else if (blob.type.includes('oggFix ')) {
              fileExtension = 'ogg';
              mimeType = 'audio/ogg';
            } else if (blob.type.includes('wav')) {
              fileExtension = 'wav';
              mimeType = 'audio/wav';
            }
          }

          const file = new File(
            [blob],
            `recorded_audio.${fileExtension}`,
            { type: mimeType }
          );

          console.log(`Created file from blob, size: ${file.size} bytes, type: ${file.type}`);
          setSelectedFile(file);
        }
      } catch (error) {
        console.error('Error creating file from audio blob:', error);
        toast({
          title: 'Recording Error',
          description: 'Failed to process the recorded audio.',
          variant: 'destructive',
        });
      }
    }
  })

  // Handle recording errors
  useEffect(() => {
    if (recordingError) {
      console.error('Recording error:', recordingError)
      toast({
        title: 'Recording Error',
        description: recordingError,
        variant: 'destructive',
      })
    }
  }, [recordingError, toast])
  // Combine loading states
  const [isLoading, setIsLoading] = useState(false)

  // Update loading state when chat loading state changes
  useEffect(() => {
    setIsLoading(chatLoading)
  }, [chatLoading])

  // Create a new chat if we're on the main chat page and no chat is loaded
  useEffect(() => {
    const initializeChat = async () => {
      // If we're on the main chat page (not a specific chat) and there are no messages
      // other than the initial welcome message, and no chat is loaded, create a new chat
      if (!currentChatId && !chat && storedMessages.length <= 1 && storedMessages[0]?.id === 'welcome') {
        try {
          console.log('Creating new chat...');
          // Create a new chat with the welcome message
          await createChat('New Chat', storedMessages);
        } catch (error) {
          console.error('Error creating initial chat:', error);
        }
      }
    };

    initializeChat();
  }, [storedMessages, createChat, chat, currentChatId])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // Token usage tracking
  const { tokenUsage, addTokenUsage } = useTokenUsage({ sessionId: 'chat-session' })

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
    percentageUsed: 0
  })

  // Fetch token stats from user's subscription
  useEffect(() => {
    const fetchTokenStats = async () => {
      try {
        // Get the user's token usage stats
        const response = await fetch('/api/token-usage/stats')
        if (response.ok) {
          const data = await response.json()
          setTokenStats({
            tokenLimit: data.tokenLimit || 100000,
            tokensUsed: data.tokensUsed || 0,
            tokensRemaining: data.tokensRemaining || 100000,
            percentageUsed: data.percentageUsed || 0
          })
        }
      } catch (error) {
        console.error('Error fetching token stats:', error)
      }
    }

    fetchTokenStats()

    // Set up interval to refresh token stats every minute
    const intervalId = setInterval(fetchTokenStats, 60000)

    // Clean up interval on unmount
    return () => clearInterval(intervalId)
  }, [])

  // Search functionality
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Message[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const { error, handleFileError, handleMessageError, clearError } = useChatErrors()
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
  } = useFileProcessing()
  const { validateFile, getFileType } = useFileValidation()
  const [showAnalysisDialog, setShowAnalysisDialog] = useState(false)
  const [currentAnalysis, setCurrentAnalysis] = useState<Message | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Search function
  const handleSearch = (query: string) => {
    if (!query.trim()) {
      clearSearch()
      return
    }

    setIsSearching(true)
    setSearchQuery(query)

    console.log('Searching for:', query, 'in', messages.length, 'messages');

    // Enhanced search implementation
    const results = messages.filter(message => {
      // Skip system messages or empty content
      if (!message.content || message.role === 'system') {
        return false;
      }

      // Check if the message content includes the query (case insensitive)
      const contentMatch = message.content.toLowerCase().includes(query.toLowerCase());

      // If there's an attachment, also check its name or type
      const attachmentMatch = message.attachmentName
        ? message.attachmentName.toLowerCase().includes(query.toLowerCase())
        : false;

      return contentMatch || attachmentMatch;
    });

    console.log('Search results:', results.length);
    setSearchResults(results);
  }

  const clearSearch = () => {
    setSearchQuery('')
    setSearchResults([])
    setIsSearching(false)
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleSendMessage = async (e: React.FormEvent | string) => {
    // Handle both form events and direct string inputs
    let messageContent = input;

    if (typeof e === 'object') {
      e.preventDefault();
      // Using the input state value
    } else if (typeof e === 'string') {
      // Using the provided string directly
      messageContent = e;
    }

    if ((!messageContent.trim() && !selectedFile) || isLoading || isProcessing) return

    clearError()
    startProcessing()

    let userMessage: Message = {
      id: Date.now().toString(),
      role: "user", // Ensure this is set to "user"
      content: messageContent,
    }

    // Add user message to local state immediately for better UX
    console.log('Adding user message to local state:', userMessage);

    // Force update the messages state with the new user message
    // Create a new array to ensure React detects the change
    const updatedMessages = [...messages, userMessage];
    console.log('Setting messages state directly:', updatedMessages);

    // Set the messages state with the updated messages
    setMessages(updatedMessages);

    // Log the current messages after update
    console.log('Messages after update:', updatedMessages.length);

    if (selectedFile) {
      // Validate file
      const validationError = validateFile(selectedFile)
      if (validationError) {
        handleFileError(new Error(validationError.message), () => {
          setSelectedFile(null)
          resetProcessing()
        })
        return
      }

      const fileType = getFileType(selectedFile)
      userMessage = {
        ...userMessage,
        attachmentType: fileType,
        attachmentName: selectedFile.name,
        content: input || `I've uploaded a ${fileType} file for analysis: ${selectedFile.name}`,
      }

      // Update the message in the UI with attachment info
      setMessages(prev => prev.map(msg =>
        msg.id === userMessage.id ? userMessage : msg
      ))

      try {
        let fileContent = ""

        if (selectedFile.type === "application/pdf") {
          try {
            // Extract text from PDF using our utility function
            fileContent = await extractTextFromPdf(selectedFile)
            // Update progress to show user something is happening
            updateProgress(75)
          } catch (error) {
            console.error("PDF processing error:", error)
            fileContent = "[PDF content could not be extracted. Processing as a binary file.]"
            // Update progress to show user something is happening
            updateProgress(50)
            // Set a more specific error message
            setProcessingError("PDF processing error: The file might be corrupted or password-protected.")
          }
        } else if (fileType === "audio" || fileType === "video") {
          try {
            // For audio and video files, we'll send them to the server for transcription
            // First, create a FormData object to send the file
            const formData = new FormData()
            formData.append('file', selectedFile)
            formData.append('fileType', fileType)

            // Show a detailed processing message
            if (fileType === "video") {
              setProcessingError(`Processing video: extracting audio and transcribing content. This may take a moment...`)
            } else {
              setProcessingError(`Transcribing ${fileType} content. This may take a moment...`)
            }

            // Update progress to show we're starting the transcription process
            updateProgress(20)

            // Set up a progress simulation for better UX
            const progressInterval = setInterval(() => {
              updateProgress(prev => {
                // Simulate progress up to 90% (leave room for final steps)
                const newProgress = Math.min(prev + (Math.random() * 3), 90);
                return newProgress;
              });
            }, 1000);

            let responseData;
            try {
              // Send the file to the server for transcription
              const response = await fetch('/api/transcribe', {
                method: 'POST',
                body: formData,
              })

              // Clear the progress interval
              clearInterval(progressInterval);

              if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || `Failed to transcribe ${fileType} file. Server returned ${response.status}`)
              }

              // Set progress to 95% to indicate we're almost done
              updateProgress(95)

              // Get the response data
              responseData = await response.json()
            } catch (error) {
              // Clear the progress interval if there's an error
              clearInterval(progressInterval);
              throw error;
            }

            // Validate the transcript content
            if (!responseData?.transcript || responseData.transcript === 'undefined' || responseData.transcript.trim() === '') {
              console.warn('Received empty or undefined transcript from API');
              fileContent = `[${fileType.toUpperCase()} content could not be transcribed]`;
            } else {
              console.log('Transcript received successfully:', responseData.transcript.substring(0, 100) + '...');
              fileContent = responseData.transcript;
            }

            // Get the transcription method if available
            const transcriptionMethod = responseData?.transcriptionMethod || 'unknown';

            // Show success message with transcription method
            setProcessingError(`Successfully transcribed ${fileType} content using ${transcriptionMethod}. Analyzing...`)

            // Update progress
            updateProgress(80)
          } catch (error) {
            console.error("Media file processing error:", error)

            // Provide more specific error messages based on the error
            let errorMessage = `Failed to transcribe ${fileType} file. The file might be corrupted or in an unsupported format.`

            if (error instanceof Error) {
              if (error.message.includes('Whisper') && error.message.includes('Google')) {
                errorMessage = `Transcription failed with both services. Please try a different ${fileType} file or format.`
              } else if (error.message.includes('extract audio')) {
                errorMessage = `Could not extract audio from video. Please try a different video format or upload an audio file directly.`
              } else if (error.message.includes('file size')) {
                errorMessage = `File is too large. Please upload a smaller file (max 10MB).`
              }
            }

            setProcessingError(errorMessage)

            // Show toast notification for better visibility
            toast({
              title: `${fileType.charAt(0).toUpperCase() + fileType.slice(1)} Processing Error`,
              description: errorMessage,
              variant: 'destructive',
            })

            handleFileError(error, () => {
              setSelectedFile(null)
              resetProcessing()
            })
            return
          }
        }

        // User message is already added to the UI at the beginning of the function
        // Save the user message to storage
        await saveMessage(userMessage)
        setInput("")
        setSelectedFile(null)
        setRecordingComplete(false)
        setIsLoading(true)

        // Add a temporary loading message
        const loadingMessage: Message = {
          id: 'loading-' + Date.now(),
          role: 'assistant',
          content: 'Analyzing your file...',
        }
        setMessages(prev => [...prev, loadingMessage])

        try {
          const analysisMessage = await analyzeContentWithGemini(
            fileType,
            fileContent,
            selectedFile.name,
            input
          )

          // Remove the loading message and save the analysis message to storage
          setMessages(prev => prev.filter(msg => !msg.id.startsWith('loading-')))
          await saveMessage(analysisMessage)

          setCurrentAnalysis(analysisMessage)
          setShowAnalysisDialog(true)

          // Track token usage if available
          if (analysisMessage.tokenUsage) {
            addTokenUsage({
              promptTokens: analysisMessage.tokenUsage.promptTokens,
              completionTokens: analysisMessage.tokenUsage.completionTokens,
              totalTokens: analysisMessage.tokenUsage.totalTokens,
              estimatedCost: 0, // Will be calculated by the hook
              model: 'gemini-pro-vision' // Using vision model for content analysis
            })
          }
        } catch (error) {
          // Remove the loading message
          setMessages(prev => prev.filter(msg => !msg.id.startsWith('loading-')))
          handleFileError(error, () => {
            setSelectedFile(null)
            resetProcessing()
          })
        } finally {
          setIsLoading(false)
          finishProcessing()
        }
      } catch (error) {
        handleFileError(error, () => {
          setSelectedFile(null)
          resetProcessing()
        })
      }
    } else {
      // User message is already added to the UI at the beginning of the function
      // Save the user message to storage
      console.log('Saving user message to storage:', userMessage)
      try {
        await saveMessage(userMessage)
        console.log('User message saved successfully')
      } catch (error) {
        console.error('Error saving user message:', error)
      }
      setInput("")
      setIsLoading(true)

      // Add a temporary loading message with a clear loading ID
      const loadingMessage: Message = {
        id: 'loading-' + Date.now().toString(),
        role: 'assistant',
        content: 'Thinking...',
      }
      console.log('Adding loading message:', loadingMessage.id);
      setMessages(prev => [...prev, loadingMessage])

      try {
        const result = await sendGeminiMessage(input)
        // Remove the loading message and save the AI response to storage
        setMessages(prev => prev.filter(msg => !msg.id.startsWith('loading-')))
        await saveMessage(result)

        // Track token usage if available
        if (result.tokenUsage) {
          addTokenUsage({
            promptTokens: result.tokenUsage.promptTokens,
            completionTokens: result.tokenUsage.completionTokens,
            totalTokens: result.tokenUsage.totalTokens,
            estimatedCost: 0, // Will be calculated by the hook
            model: 'gemini-pro'
          })
        }
      } catch (error) {
        // Remove the loading message
        setMessages(prev => prev.filter(msg => !msg.id.startsWith('loading-')))
        handleMessageError(() => {
          setIsLoading(false)
        })
      } finally {
        setIsLoading(false)
        finishProcessing()
      }
    }
  }

  // generateAnalysisMessage function removed - not used

  const toggleRecording = async () => {
    if (!isRecording) {
      // Check if browser supports MediaRecorder
      if (typeof window !== 'undefined' && !window.MediaRecorder) {
        console.error('MediaRecorder is not supported in this browser');
        toast({
          title: 'Recording Not Supported',
          description: 'Your browser does not support audio recording. Please try a different browser like Chrome or Firefox.',
          variant: 'destructive',
        });
        return;
      }

      // Check if user has granted microphone permissions
      try {
        const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        console.log('Microphone permission status:', permissionStatus.state);

        if (permissionStatus.state === 'denied') {
          toast({
            title: 'Microphone Access Denied',
            description: 'Please allow microphone access in your browser settings to record audio.',
            variant: 'destructive',
          });
          return;
        }
      } catch (error) {
        console.log('Could not check microphone permission:', error);
        // Continue anyway as some browsers don't support the permissions API
      }

      // Start recording
      setRecordingComplete(false);
      setShowAudioPlayer(false);
      setAudioBlob(null);

      try {
        console.log('Attempting to start recording...');
        await startRecording();
        console.log('Recording started successfully');
      } catch (error) {
        console.error('Error starting recording:', error);
        toast({
          title: 'Recording Error',
          description: error instanceof Error ? error.message : 'Failed to start recording. Please check your microphone permissions.',
          variant: 'destructive',
        });
      }
    } else {
      // Stop recording
      try {
        console.log('Attempting to stop recording...');
        stopRecording();
        console.log('Recording stopped successfully');
      } catch (error) {
        console.error('Error stopping recording:', error);
        toast({
          title: 'Recording Error',
          description: error instanceof Error ? error.message : 'Failed to stop recording.',
          variant: 'destructive',
        });
      }
    }
  }

  const cancelRecording = () => {
    cancelAudioRecording()
    setRecordingComplete(false)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const clearSelectedFile = () => {
    setSelectedFile(null)
    setRecordingComplete(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const renderFilePreview = () => {
    if (!selectedFile) return null

    let icon = <FileText className="h-5 w-5 text-muted-foreground" />
    if (selectedFile.type.startsWith("audio/")) {
      icon = <Mic className="h-5 w-5 text-muted-foreground" />
    } else if (selectedFile.type.startsWith("video/")) {
      icon = <Video className="h-5 w-5 text-muted-foreground" />
    }

    const isRecordedAudio = selectedFile.name === "recorded_audio.mp3" && recordingComplete

    return (
      <AnimatedElement type="slide-up" duration={400}>
        {showAudioPlayer && audioBlob && isRecordedAudio && (
          <AudioPlayer
            audioBlob={audioBlob}
            className="mb-3"
            onConfirm={() => {
              try {
                if (!selectedFile) {
                  throw new Error('No audio file available');
                }

                console.log('Submitting form with recorded audio file');
                setShowAudioPlayer(false);

                // Process the file by triggering the form submission
                handleSendMessage(new Event('submit') as any);
              } catch (error) {
                console.error('Error processing audio file:', error);
                toast({
                  title: 'Recording Error',
                  description: error instanceof Error ? error.message : 'Failed to process the recorded audio.',
                  variant: 'destructive',
                });
              }
            }}
            onCancel={() => {
              setShowAudioPlayer(false)
              resetProcessing()
              cancelAudioRecording()
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
          <div className="p-2 bg-primary/10 rounded-full">
            {icon}
          </div>
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
              <Progress value={uploadProgress} className="h-1.5 rounded-full bg-secondary" />
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
    )
  }

  const renderMessage = (message: Message) => {
    console.log('Rendering message:', message.id, message.role, message.content.substring(0, 30) + '...')

    // Ensure the message role is properly set
    const messageToRender = {
      ...message,
      role: message.role || (message.id.includes('user') ? 'user' : 'assistant')
    };

    return (
      <ChatMessage
        key={messageToRender.id}
        message={messageToRender}
        isLoading={isLoading}
        onShowPerformance={(msg: Message) => setCurrentAnalysis(msg)}
      />
    )
  }

  const renderAnalysisDialog = () => {
    if (!currentAnalysis || !currentAnalysis.performanceData) return null

    const { overallScore, metrics, strengths, improvements } = currentAnalysis.performanceData

    return (
      <Dialog open={showAnalysisDialog} onOpenChange={setShowAnalysisDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl border-primary/20 bg-card/95 backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
              Performance Analysis
            </DialogTitle>
            <DialogDescription>Detailed breakdown of your sales performance</DialogDescription>
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
                <p className="text-muted-foreground">Overall Performance Score</p>
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
                    role: 'user',
                    content: 'I want to practice my sales skills. Can you set up a role-play scenario based on your recommendations?'
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
    )
  }

  // Suggested prompts moved to a separate component

  return (
    <AppLayout>
      <div className="container py-6 max-w-5xl">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
            AI Sales Coach
          </h1>
          <ChatSearch onSearch={handleSearch} onClear={clearSearch} />
        </div>
        <div className="flex flex-col h-[calc(100vh-12rem)]">
          <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-4">
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
                      const aTime = parseInt(a.id.replace(/\D/g, '')) || 0;
                      const bTime = parseInt(b.id.replace(/\D/g, '')) || 0;

                      // Sort by timestamp
                      return aTime - bTime;
                    })
                    .map(renderMessage)
                ) : (
                  <div className="p-4 text-center">
                    <p className="text-muted-foreground">No messages found matching your search.</p>
                  </div>
                )}
              </>
            ) : (
              <>
                {messages.length > 0 ? (
                  messages
                    .sort((a, b) => {
                      // If messages have the same ID, maintain original order
                      if (a.id === b.id) return 0;
                      
                      // Convert IDs to numbers for comparison, fallback to 0 if conversion fails
                      const aTime = Number(a.id) || 0;
                      const bTime = Number(b.id) || 0;
                      
                      return aTime - bTime;
                    })
                    .map((message) => (
                      <ChatMessage
                        key={message.id}
                        message={message}
                        isLoading={isLoading}
                        onShowPerformance={(msg) => setCurrentAnalysis(msg)}
                      />
                    ))
                ) : (
                  <div className="p-4 text-center">
                    <p className="text-muted-foreground">No messages to display. Start a conversation!</p>
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

          {renderFilePreview()}

          {/* Token usage display */}
          <div className="mt-2">
            <div className="flex gap-2">
              {/* Session token usage */}
              <div className="flex-1">
                <TokenUsage
                  tokensUsed={tokenUsage.session.totalTokens}
                  tokensLimit={100000} // Session limit
                  estimatedCost={tokenUsage.session.estimatedCost}
                  className="h-full"
                />
              </div>

              {/* Total account token usage */}
              <div className="flex-1">
                <Card className="border-primary/10 bg-card/95 backdrop-blur-sm h-full">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Coins size={16} className="text-primary" />
                        <span className="text-sm font-medium">Account Usage</span>
                      </div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button className="rounded-full p-1 hover:bg-accent/50">
                              <Info size={14} className="text-muted-foreground" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">
                              Your monthly token usage. Free accounts have a limit of 100,000 tokens.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {tokenStats.tokensUsed.toLocaleString()} / {tokenStats.tokenLimit.toLocaleString()} tokens
                        </span>
                        <span className="font-medium">
                          {tokenStats.tokensRemaining.toLocaleString()} left
                        </span>
                      </div>

                      <Progress
                        value={tokenStats.percentageUsed || 0}
                        className="h-1.5 bg-secondary/30"
                        style={{
                          '--progress-value': `${tokenStats.percentageUsed || 0}%`,
                          '--progress-color': (tokenStats.percentageUsed || 0) < 50 ? 'var(--green-500)' :
                                             (tokenStats.percentageUsed || 0) < 80 ? 'var(--amber-500)' :
                                             'var(--red-500)'
                        } as React.CSSProperties}
                      />

                      {tokenStats.percentageUsed > 80 && (
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <AlertCircle size={14} className="text-red-500" />
                          <span className="text-xs text-red-500">
                            Approaching monthly limit
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {isRecording ? (
            <AnimatedElement type="fade-in" duration={300} className="w-full">
              <div className="flex items-center gap-2 p-4 border rounded-xl bg-accent/30 mb-3 animate-pulse-glow">
                <div className="flex-1 flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse"></div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    <span className="text-lg font-medium">{formatDuration(recordingDuration)}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">Recording...</span>
                </div>
                <div className="flex gap-2">
                  <AnimatedButton variant="outline" size="sm" className="rounded-full" onClick={cancelRecording} animation="shake">
                    Cancel
                  </AnimatedButton>
                  <AnimatedButton variant="gradient" size="sm" className="rounded-full" onClick={toggleRecording} animation="pulse">
                    Done
                  </AnimatedButton>
                </div>
              </div>
            </AnimatedElement>
          ) : (
            <AnimatedElement type="slide-up" duration={500} className="w-full">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <AnimatedButton
                        type="button"
                        variant={recordingComplete ? "gradient" : "outline"}
                        size="icon"
                        onClick={toggleRecording}
                        disabled={isLoading || !!selectedFile}
                        className="rounded-full"
                        animation={recordingComplete ? "pulse" : "none"}
                      >
                        {recordingComplete ? <Mic className="h-4 w-4 text-white" /> : <Mic className="h-4 w-4" />}
                      </AnimatedButton>
                    </TooltipTrigger>
                    <TooltipContent>{recordingComplete ? "Recording complete" : "Record audio"}</TooltipContent>
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
                        disabled={isLoading || recordingComplete || !!selectedFile}
                        className="rounded-full"
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
                    <TooltipContent>Upload file (audio, video, or document)</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <Input
                  placeholder="Type your message or ask for sales advice..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={isLoading}
                  className="flex-1 rounded-full border-primary/20 focus-visible:ring-primary bg-accent/30 backdrop-blur-sm transition-all duration-300 hover:shadow-inner"
                />

                <AnimatedButton
                  type="submit"
                  size="icon"
                  disabled={(!input.trim() && !selectedFile) || isLoading}
                  variant="gradient"
                  className="rounded-full"
                  animation="pop"
                  ripple
                >
                  <Send className="h-4 w-4" />
                </AnimatedButton>
              </form>
            </AnimatedElement>
          )}
        </div>
      </div>

      {renderAnalysisDialog()}
    </AppLayout>
  )
}

