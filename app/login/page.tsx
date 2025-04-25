"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Chrome as Google } from "lucide-react";
import { handleGoogleLogin as initiateGoogleLogin, processGoogleAuthResponse } from "@/lib/google-auth";
import { useAuth } from "@/hooks/use-auth";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { googleAuth } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Google client ID from environment variable
  const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      console.warn("Google Client ID is not configured. Google login will not work.");
    }
  }, []);

  const handleGoogleLogin = async () => {
    setError("");
    setIsLoading(true);

    try {
      if (!GOOGLE_CLIENT_ID) {
        throw new Error('Google Client ID is not configured');
      }

      console.log('Initiating Google login with client ID:', GOOGLE_CLIENT_ID);

      await initiateGoogleLogin(GOOGLE_CLIENT_ID,
        async (response) => {
          try {
            console.log('Google login response received:', response ? 'success' : 'failed');

            const userData = await processGoogleAuthResponse(response);
            console.log('Processed Google auth data:', {
              email: userData.email,
              name: userData.name,
              hasGoogleId: !!userData.googleId
            });

            await googleAuth(userData);

            toast({
              title: "Login successful",
              description: "Welcome to GoCloser!",
            });

            router.push('/chat');
          } catch (error: any) {
            console.error('Error processing Google login:', error);
            setError(error.message || 'Failed to process Google login');
            setIsLoading(false);
          }
        },
        (error) => {
          console.error('Google authentication error:', error);
          setError(error.message || 'Google authentication failed');
          setIsLoading(false);
        }
      );

      setTimeout(() => {
        setIsLoading(false);
      }, 5000);

    } catch (err: any) {
      console.error('Google login initialization error:', err);
      setError(err.message || 'An error occurred during Google login');
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Simple login logic
      if (email && password) {
        // Simulate successful login
        setTimeout(() => {
          router.push("/chat");
        }, 1000);
      } else {
        setError("Please enter both email and password");
      }
    } catch (err) {
      setError("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-background to-accent/20">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
          <CardDescription>Log in to your account to continue</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" className="w-full rounded-full" onClick={handleGoogleLogin} disabled={isLoading}>
            <Google className="mr-2 h-4 w-4" />
            Sign in with Google
          </Button>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md border border-destructive">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Logging in..." : "Log in"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-center">
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

