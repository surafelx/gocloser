'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  BarChart, 
  ThumbsUp, 
  ThumbsDown, 
  Copy, 
  CheckCheck,
  Share
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { PerformanceAnalysis } from './performance-analysis';
import { AnimatedElement } from '@/components/animated-element';

interface MessageActionsProps {
  onCopy: () => void;
  onLike?: () => void;
  onDislike?: () => void;
  onViewAnalysis?: () => void;
  hasAnalysis?: boolean;
  performanceData?: {
    overallScore: number;
    metrics: {
      name: string;
      score: number;
    }[];
    strengths: string[];
    improvements: string[];
  };
  attachmentName?: string;
  attachmentType?: 'audio' | 'video' | 'text';
  className?: string;
}

export function MessageActions({
  onCopy,
  onLike,
  onDislike,
  onViewAnalysis,
  hasAnalysis,
  performanceData,
  attachmentName,
  attachmentType,
  className
}: MessageActionsProps) {
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [showAnalysisDialog, setShowAnalysisDialog] = useState(false);
  
  const handleCopy = () => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handleLike = () => {
    if (onLike) onLike();
    setLiked(true);
    setDisliked(false);
  };
  
  const handleDislike = () => {
    if (onDislike) onDislike();
    setDisliked(true);
    setLiked(false);
  };
  
  const handleViewAnalysis = () => {
    if (onViewAnalysis) onViewAnalysis();
    setShowAnalysisDialog(true);
  };
  
  return (
    <>
      <div className={cn(
        "flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity",
        className
      )}>
        {hasAnalysis && performanceData && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-full hover:bg-primary/10 hover:text-primary"
            onClick={handleViewAnalysis}
            title="View performance analysis"
          >
            <BarChart className="h-3.5 w-3.5" />
          </Button>
        )}
        
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-7 w-7 rounded-full",
            liked ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" : "hover:bg-accent"
          )}
          onClick={handleLike}
          title="Helpful"
        >
          <ThumbsUp className="h-3.5 w-3.5" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-7 w-7 rounded-full",
            disliked ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" : "hover:bg-accent"
          )}
          onClick={handleDislike}
          title="Not helpful"
        >
          <ThumbsDown className="h-3.5 w-3.5" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-7 w-7 rounded-full",
            copied ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" : "hover:bg-accent"
          )}
          onClick={handleCopy}
          title="Copy to clipboard"
        >
          {copied ? <CheckCheck className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </Button>
      </div>
      
      {/* Performance Analysis Dialog */}
      <Dialog open={showAnalysisDialog} onOpenChange={setShowAnalysisDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Performance Analysis</DialogTitle>
            <DialogDescription>
              Detailed analysis of your {attachmentType === 'audio' ? 'audio recording' : 
                                        attachmentType === 'video' ? 'video recording' : 'document'}
            </DialogDescription>
          </DialogHeader>
          
          <AnimatedElement type="fade-in" duration={300}>
            {performanceData && (
              <PerformanceAnalysis
                performanceData={performanceData}
                fileName={attachmentName}
                fileType={attachmentType}
                expanded={true}
              />
            )}
          </AnimatedElement>
        </DialogContent>
      </Dialog>
    </>
  );
}
