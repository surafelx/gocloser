'use client';

import { cn } from '@/lib/utils';
import { BotAvatar } from '@/components/chat/bot-avatar';
import { UserAvatar } from '@/components/chat/user-avatar';
import { MarkdownMessage } from '@/components/chat/markdown-message';
import { PerformanceAnalysis } from '@/components/chat/performance-analysis';
import { MessageActions } from '@/components/chat/message-actions';
import { TypingAnimation } from '@/components/chat/typing-animation';

export interface Message {
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
  isLoading, // Used for loading state
  onShowPerformance
}: ChatMessageProps) {
  // Ensure we're correctly identifying user messages
  // This is critical for proper display
  const isUser = message.role === 'user';

  console.log('Rendering ChatMessage:', message.id, message.role, message.content.substring(0, 30), 'isUser:', isUser);

  // For debugging - log the exact message object
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[DEBUG-CHAT-MESSAGE] Message ${message.id}:`, {
      role: message.role,
      isUser,
      isLoading,
      content: message.content.substring(0, 50) + '...'
    });
  }

  // Force role to be either 'user' or 'assistant' if it's not set correctly
  if (message.role !== 'user' && message.role !== 'assistant' && message.role !== 'system') {
    console.warn(`[CHAT-MESSAGE] Invalid role detected: ${message.role}, defaulting to 'assistant'`);
    message.role = 'assistant';
  }

  // Use isLoading to determine if we should show a loading state
  const showLoading = isLoading && message.id.startsWith('loading');

  return (
    <div className={cn(
      'group flex items-start gap-x-3 py-3 w-full',
      isUser ? 'justify-end' : 'justify-start'
    )}>
      {!isUser && <BotAvatar />}
      <div className={cn(
        'rounded-md px-4 py-2.5 max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl text-sm',
        isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
      )}>
        {message.attachmentType && (
          <div className="mb-2 text-xs border-l-2 border-primary/30 pl-2 py-1 bg-primary/5 rounded">
            <span className="font-medium">Attached {message.attachmentType} file:</span> {message.attachmentName}
          </div>
        )}

        {showLoading || (message.id.startsWith('loading-') && !isUser) ? (
          <TypingAnimation />
        ) : message.isAnalysis ? (
          <PerformanceAnalysis performanceData={message.performanceData} fileName={message.attachmentName} fileType={message.attachmentType} />
        ) : (
          <MarkdownMessage content={message.content} />
        )}

        {!isUser && (
          <MessageActions
            onCopy={() => {
              navigator.clipboard.writeText(message.content);
            }}
            hasAnalysis={!!message.performanceData}
            performanceData={message.performanceData}
            attachmentName={message.attachmentName}
            attachmentType={message.attachmentType}
            onViewAnalysis={() => onShowPerformance?.(message)}
          />
        )}
      </div>
      {isUser && <UserAvatar />}
    </div>
  );
}
