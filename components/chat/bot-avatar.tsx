'use client';

import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function BotAvatar() {
  return (
    <Avatar className="h-8 w-8 border border-primary/10">
      <AvatarImage src="/images/robot-avatar.svg" alt="AI Assistant" />
      <AvatarFallback className="bg-primary/10 text-primary">AI</AvatarFallback>
    </Avatar>
  );
}
