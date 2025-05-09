'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';

// Define user type
interface User {
  id: string;
  name: string;
  email: string;
  profilePicture?: string;
}

// Define auth context type
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  googleAuth: (googleData: any) => Promise<void>;
}

// Create auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth provider component
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();
  const { toast } = useToast();

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      setUser(data.user);
      toast({
        title: 'Login successful',
        description: 'Welcome back!',
      });

      // Check if user has an active subscription
      try {
        const subResponse = await fetch('/api/billing/subscription');
        const subData = await subResponse.json();

        // If user needs a subscription, redirect to billing page
        if (subData.subscription?.needsSubscription) {
          router.push('/billing');
        } else {
          router.push('/chat');
        }
      } catch (err) {
        // Default to chat page if subscription check fails
        router.push('/chat');
      }
    } catch (error: any) {
      toast({
        title: 'Login failed',
        description: error.message || 'An error occurred during login',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Signup function
  const signup = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Signup failed');
      }

      setUser(data.user);
      toast({
        title: 'Account created successfully',
        description: 'Welcome to GoCloser!',
      });

      // New users should always be directed to the billing page
      router.push('/billing');
    } catch (error: any) {
      toast({
        title: 'Signup failed',
        description: error.message || 'An error occurred during signup',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    setIsLoading(true);
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });

      setUser(null);
      toast({
        title: 'Logged out successfully',
      });
      router.push('/login');
    } catch (error: any) {
      toast({
        title: 'Logout failed',
        description: error.message || 'An error occurred during logout',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Google auth function
  const googleAuth = async (googleData: any) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(googleData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Google authentication failed');
      }

      setUser(data.user);
      toast({
        title: 'Google authentication successful',
        description: 'Welcome to GoCloser!',
      });

      // Check if user has an active subscription
      try {
        const subResponse = await fetch('/api/billing/subscription');
        const subData = await subResponse.json();

        // If user needs a subscription, redirect to billing page
        if (subData.subscription?.needsSubscription) {
          router.push('/billing');
        } else {
          router.push('/chat');
        }
      } catch (err) {
        // Default to chat page if subscription check fails
        router.push('/chat');
      }
    } catch (error: any) {
      toast({
        title: 'Google authentication failed',
        description: error.message || 'An error occurred during Google authentication',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Create the context value
  const contextValue: AuthContextType = {
    user,
    isLoading,
    login,
    signup,
    logout,
    googleAuth,
  };

  // Return the provider with the context value
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
