"use client";

import { cn } from "@/lib/utils";
import { BotAvatar } from "@/components/chat/bot-avatar";
import { UserAvatar } from "@/components/chat/user-avatar";
import { MarkdownMessage } from "@/components/chat/markdown-message";
import { PerformanceAnalysis } from "@/components/chat/performance-analysis";
import { MessageActions } from "@/components/chat/message-actions";
import { TypingAnimation } from "@/components/chat/typing-animation";

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  attachmentType?: "audio" | "video" | "text";
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
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

interface ChatMessageProps {
  message: Message;
  isLoading?: boolean;
  onShowPerformance?: (message: Message) => void;
}

export function ChatMessage({
  message,
  isLoading,
  onShowPerformance,
}: ChatMessageProps) {
  // Create a local copy of the message to avoid modifying the original
  const messageWithValidRole = { ...message };

  // Ensure the message has a valid role
  if (
    !messageWithValidRole.role ||
    (messageWithValidRole.role !== "user" &&
      messageWithValidRole.role !== "assistant" &&
      messageWithValidRole.role !== "system")
  ) {
    // Determine role based on ID pattern
    if (messageWithValidRole.id.startsWith("msg_")) {
      messageWithValidRole.role = "user";
    } else {
      messageWithValidRole.role = "assistant";
    }
    console.warn(
      `[CHAT-MESSAGE] Invalid role detected for message ${messageWithValidRole.id}, defaulting to '${messageWithValidRole.role}'`
    );
  }

  // Determine if this is a user message
  const isUser = messageWithValidRole.role === "user";
  // Only show loading animation for messages with loading- prefix or if this is the latest assistant message and isLoading is true
  const isLoadingMessage = messageWithValidRole.id.startsWith("loading-");
  const showLoading = (isLoading && !isUser && isLoadingMessage) || isLoadingMessage;

  return (
    <div
      className={cn(
        "group flex items-start gap-3 py-4",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && <BotAvatar />}
      <div
        className={cn(
          "flex flex-col space-y-2 max-w-[80%] sm:max-w-[70%]",
          isUser
            ? "items-end bg-primary/10 text-primary-foreground rounded-2xl rounded-tr-none p-4"
            : "items-start bg-muted rounded-2xl rounded-tl-none p-4"
        )}
      >
        {showLoading ||
        (messageWithValidRole.id.startsWith("loading-") && !isUser) ? (
          <TypingAnimation />
        ) : messageWithValidRole.isAnalysis ? (
          <PerformanceAnalysis
            performanceData={messageWithValidRole.performanceData}
            fileName={messageWithValidRole.attachmentName}
            fileType={messageWithValidRole.attachmentType}
          />
        ) : (
          <MarkdownMessage content={messageWithValidRole.content} />
        )}

        {!isUser && (
          <MessageActions
            onCopy={() => {
              navigator.clipboard.writeText(messageWithValidRole.content);
            }}
            hasAnalysis={!!messageWithValidRole.performanceData}
            performanceData={messageWithValidRole.performanceData}
            attachmentName={messageWithValidRole.attachmentName}
            attachmentType={messageWithValidRole.attachmentType}
            onViewAnalysis={() => onShowPerformance?.(messageWithValidRole)}
          />
        )}
      </div>
      {isUser && <UserAvatar />}
    </div>
  );
}
