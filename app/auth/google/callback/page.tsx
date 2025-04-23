"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/use-auth';

export default function GoogleCallbackPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { googleAuth } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function handleCallback() {
      try {
        // Get the token from the URL hash
        const hash = window.location.hash;
        const token = hash ? hash.substring(1).split('&').find(param => param.startsWith('access_token='))?.split('=')[1] : null;

        if (!token) {
          setError('No authentication token found');
          toast({
            title: 'Authentication failed',
            description: 'No authentication token found',
            variant: 'destructive',
          });
          setTimeout(() => router.push('/login'), 2000);
          return;
        }

        // Fetch user info from Google
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!userInfoResponse.ok) {
          setError('Failed to fetch user info from Google');
          toast({
            title: 'Authentication failed',
            description: 'Failed to fetch user info from Google',
            variant: 'destructive',
          });
          setTimeout(() => router.push('/login'), 2000);
          return;
        }

        const userInfo = await userInfoResponse.json();

        // Prepare the data for our backend
        const googleData = {
          googleId: userInfo.sub,
          email: userInfo.email,
          name: userInfo.name,
          profilePicture: userInfo.picture,
          token
        };

        console.log('Google auth data:', {
          email: googleData.email,
          name: googleData.name,
          hasGoogleId: !!googleData.googleId
        });

        // Call our auth hook to authenticate with the backend
        await googleAuth(googleData);

        // Success - redirect to chat page
        toast({
          title: 'Authentication successful',
          description: 'Welcome to GoCloser!',
        });

        router.push('/chat');
      } catch (error: any) {
        console.error('Google callback error:', error);
        setError(error.message || 'An unexpected error occurred');
        toast({
          title: 'Authentication failed',
          description: error.message || 'An unexpected error occurred',
          variant: 'destructive',
        });
        setTimeout(() => router.push('/login'), 2000);
      }
    }

    handleCallback();
  }, [router, toast, googleAuth]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-background to-accent/20">
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px]" />
      <div className="w-full max-w-md p-8 border-primary/20 shadow-xl shadow-primary/5 backdrop-blur-sm rounded-lg text-center">
        <div className="animate-pulse mb-4">
          <div className="h-12 w-12 mx-auto rounded-full bg-primary/20"></div>
        </div>
        <h1 className="text-2xl font-bold mb-2">
          {error ? 'Authentication Failed' : 'Processing Authentication...'}
        </h1>
        <p className="text-muted-foreground">
          {error || 'Please wait while we complete your Google authentication.'}
        </p>
      </div>
    </div>
  );
}
