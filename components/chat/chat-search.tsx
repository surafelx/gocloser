'use client';

import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import AnimatedElement from '@/components/animated-element';

interface ChatSearchProps {
  onSearch: (query: string) => void;
  onClear: () => void;
  className?: string;
}

export function ChatSearch({ onSearch, onClear, className }: ChatSearchProps) {
  const [query, setQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  const handleClear = () => {
    setQuery('');
    onClear();
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
    if (isExpanded) {
      handleClear();
    }
  };

  return (
    <div className={className}>
      {isExpanded ? (
        <AnimatedElement type="fade-in" duration={200}>
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <Input
              type="text"
              placeholder="Search in conversation..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 h-9 rounded-full border-primary/20 focus-visible:ring-primary bg-accent/30 backdrop-blur-sm"
              autoFocus
            />
            {query && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={handleClear}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={toggleExpand}
            >
              <X className="h-4 w-4" />
            </Button>
          </form>
        </AnimatedElement>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={toggleExpand}
        >
          <Search className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
