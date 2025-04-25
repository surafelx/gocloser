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
  isLoading,
  onShowPerformance
}: ChatMessageProps) {
  const isUser = message.role === 'user';

  console.log('Rendering ChatMessage:', message.id, message.role, message.content.substring(0, 30), 'isUser:', isUser);

  // Force the component to recognize user messages
  const userRole = isUser ? 'user' : 'assistant';

  return (
    <div className={cn(
      'group flex items-start gap-x-3 py-3 w-full',
      userRole === 'user' ? 'justify-end' : 'justify-start'
    )}>
      {userRole !== 'user' && <BotAvatar />}
      <div className={cn(
        'rounded-md px-4 py-2.5 max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl text-sm',
        userRole === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
      )}>
        {message.attachmentType && (
          <div className="mb-2 text-xs border-l-2 border-primary/30 pl-2 py-1 bg-primary/5 rounded">
            <span className="font-medium">Attached {message.attachmentType} file:</span> {message.attachmentName}
          </div>
        )}

        {message.id.startsWith('loading-') && userRole !== 'user' ? (
          <TypingAnimation />
        ) : message.isAnalysis ? (
          <PerformanceAnalysis performanceData={message.performanceData} fileName={message.attachmentName} fileType={message.attachmentType} />
        ) : (
          <MarkdownMessage content={message.content} />
        )}

        {userRole !== 'user' && message.tokenUsage && (
          <MessageActions
            message={message}
            onShowPerformance={onShowPerformance}
          />
        )}
      </div>
      {userRole === 'user' && <UserAvatar />}
    </div>
  );
}
