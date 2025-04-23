'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Coins, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface TokenUsageProps {
  tokensUsed: number;
  tokensLimit: number;
  estimatedCost: number;
  className?: string;
}

export function TokenUsage({
  tokensUsed,
  tokensLimit,
  estimatedCost,
  className,
}: TokenUsageProps) {
  // Calculate percentage of tokens used
  const usagePercentage = Math.min(100, tokensLimit > 0 ? (tokensUsed / tokensLimit) * 100 : 0);

  // Determine color based on usage
  const getUsageColor = () => {
    if (usagePercentage < 50) return 'bg-green-500';
    if (usagePercentage < 80) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <Card className={cn('border-primary/10 bg-card/95 backdrop-blur-sm', className)}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Coins size={16} className="text-primary" />
            <span className="text-sm font-medium">Token Usage</span>
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
                  Tokens are units of text processed by the AI.
                  Costs are estimated based on current API pricing.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {tokensUsed.toLocaleString()} / {tokensLimit.toLocaleString()} tokens
            </span>
            <span className="font-medium">
              ${estimatedCost.toFixed(4)}
            </span>
          </div>

          <Progress
            value={usagePercentage}
            className="h-1.5 bg-secondary/30"
            style={{
              '--progress-value': `${usagePercentage}%`,
              '--progress-color': usagePercentage < 50 ? 'var(--green-500)' :
                                 usagePercentage < 80 ? 'var(--amber-500)' :
                                 'var(--red-500)'
            } as React.CSSProperties}
          />

          {usagePercentage > 80 && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <AlertCircle size={14} className="text-red-500" />
              <span className="text-xs text-red-500">
                Approaching token limit
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
