'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface TypingAnimationProps {
  className?: string;
}

export function TypingAnimation({ className }: TypingAnimationProps) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev.length >= 3) return '';
        return prev + '.';
      });
    }, 400);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={cn('flex items-center space-x-1 text-primary', className)}>
      <div className="h-2 w-2 rounded-full bg-primary/60 animate-pulse"></div>
      <div className="h-2 w-2 rounded-full bg-primary/60 animate-pulse delay-150"></div>
      <div className="h-2 w-2 rounded-full bg-primary/60 animate-pulse delay-300"></div>
      <span className="text-xs text-muted-foreground">Typing{dots}</span>
    </div>
  );
}
