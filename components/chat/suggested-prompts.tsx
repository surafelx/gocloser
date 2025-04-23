'use client';

import React from 'react';
import { AlertCircle, HelpCircle, ThumbsUp, Zap } from 'lucide-react';
import { AnimatedButton } from '@/components/ui/animated-button';
import AnimatedElement from '@/components/animated-element';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SuggestedPromptsProps {
  onSelectPrompt: (prompt: string) => void;
}

export function SuggestedPrompts({ onSelectPrompt }: SuggestedPromptsProps) {
  const suggestedPrompts = [
    { text: "Handle objections", icon: <AlertCircle className="h-6 w-6" />, size: "large" },
    { text: "Value proposition", icon: <Zap className="h-6 w-6" /> },
    { text: "Closing techniques", icon: <ThumbsUp className="h-6 w-6" /> },
    { text: "Discovery questions", icon: <HelpCircle className="h-6 w-6" /> },
  ];

  return (
    <AnimatedElement type="fade-in" duration={800} delay={500} className="mb-6">
      <div className="flex justify-center gap-3 flex-wrap">
        <TooltipProvider>
          {suggestedPrompts.map((prompt, index) => (
            <AnimatedElement
              key={index}
              type="zoom-in"
              duration={500}
              delay={700 + (index * 150)}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <AnimatedButton
                    variant="gradient"
                    className={`suggestion-circle ${prompt.size === "large" ? "w-20 h-20" : "w-14 h-14"}`}
                    animation="none"
                    onClick={() => {
                      onSelectPrompt(`Help me with ${prompt.text.toLowerCase()}`);
                    }}
                  >
                    {prompt.icon}
                  </AnimatedButton>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{prompt.text}</p>
                </TooltipContent>
              </Tooltip>
            </AnimatedElement>
          ))}
        </TooltipProvider>
      </div>
    </AnimatedElement>
  );
}
