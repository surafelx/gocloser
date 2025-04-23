"use client";

import React, { ReactNode } from 'react';
import { useAnimation } from '@/hooks/use-animation';
import { AnimationType } from '@/lib/animation-utils';
import { cn } from '@/lib/utils';

interface AnimatedElementProps {
  children: ReactNode;
  type: AnimationType;
  duration?: number;
  delay?: number;
  className?: string;
  triggerOnce?: boolean;
  as?: React.ElementType;
  staggerIndex?: number; // For staggered animations in lists
}

export function AnimatedElement({
  children,
  type,
  duration,
  delay: propDelay,
  className,
  triggerOnce = true,
  as: Component = 'div',
  staggerIndex = 0,
}: AnimatedElementProps) {
  // Calculate staggered delay if staggerIndex is provided
  const delay = propDelay !== undefined
    ? propDelay
    : staggerIndex > 0
      ? staggerIndex * 150 // 150ms between each staggered item
      : 0;

  const { ref, style, isVisible } = useAnimation({
    type,
    duration,
    delay,
    triggerOnce,
  });

  return (
    <Component
      ref={ref}
      className={cn(className, isVisible ? `animate-${type}` : 'opacity-0')}
      style={{
        ...style,
        animationDelay: `${delay}ms`,
        animationDuration: duration ? `${duration}ms` : undefined,
      }}
    >
      {children}
    </Component>
  );
}

// Also export as default for backward compatibility
export default AnimatedElement;
