'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';

export function UserAvatar() {
  const { user } = useAuth();
  
  return (
    <Avatar className="h-8 w-8 border border-primary/10">
      <AvatarFallback className="bg-primary/10 text-primary">
        {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
      </AvatarFallback>
    </Avatar>
  );
}
