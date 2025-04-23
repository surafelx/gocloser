"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Chrome as Google } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { handleGoogleLogin as initiateGoogleLogin, processGoogleAuthResponse } from "@/lib/google-auth"
import { DebugEnv } from "@/components/debug-env"
import { useAuth } from "@/hooks/use-auth"

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { googleAuth } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Google client ID from environment variable
  const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""

  useEffect(() => {
    // Log the Google Client ID for debugging
    if (!GOOGLE_CLIENT_ID) {
      console.warn("Google Client ID is not configured. Google login will not work.")
    }
  }, [])

  // Form refs
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      // Get form values
      const email = emailRef.current?.value
      const password = passwordRef.current?.value

      if (!email || !password) {
        setError('Please enter both email and password')
        setIsLoading(false)
        return
      }

      // Call the login API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }

      // Success - redirect to chat page
      toast({
        title: "Login successful",
        description: "Welcome back!",
      })

      router.push('/chat')
    } catch (err: any) {
      setError(err.message || 'An error occurred during login')
      console.error('Login error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setError(null)
    setIsLoading(true)

    try {
      if (!GOOGLE_CLIENT_ID) {
        throw new Error('Google Client ID is not configured')
      }

      console.log('Initiating Google login with client ID:', GOOGLE_CLIENT_ID)

      // Handle Google login with our utility function
      await initiateGoogleLogin(GOOGLE_CLIENT_ID,
        async (response) => {
          try {
            console.log('Google login response received:', response ? 'success' : 'failed')

            // Process the Google auth response
            const userData = await processGoogleAuthResponse(response)
            console.log('Processed Google auth data:', {
              email: userData.email,
              name: userData.name,
              hasGoogleId: !!userData.googleId
            })

            // Call our auth hook to authenticate with the backend
            await googleAuth(userData)

            // Success - redirect to chat page
            toast({
              title: "Google login successful",
              description: "Welcome back!",
            })

            router.push('/chat')
          } catch (error: any) {
            console.error('Error processing Google login:', error)
            setError(error.message || 'Failed to process Google login')
            setIsLoading(false)
          }
        },
        (error) => {
          console.error('Google authentication error:', error)
          setError(error.message || 'Google authentication failed')
          setIsLoading(false)
        }
      )

      // Set a timeout to reset loading state if Google popup doesn't trigger callback
      setTimeout(() => {
        setIsLoading(false)
      }, 5000)

    } catch (err: any) {
      console.error('Google login initialization error:', err)
      setError(err.message || 'An error occurred during Google login')
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-background to-accent/20">
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px]" />
      <Card className="w-full max-w-md border-primary/20 shadow-xl shadow-primary/5 backdrop-blur-sm">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <div className="text-3xl font-bold flex items-center">
              <span className="text-primary animate-pulse-glow">GoCloser</span>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
          <CardDescription>Log in to your account to continue</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" className="w-full rounded-full" onClick={handleGoogleLogin} disabled={isLoading}>
            <Google className="mr-2 h-4 w-4" />
            Continue with Google
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
                required
                ref={emailRef}
                className="rounded-full border-primary/20 focus-visible:ring-primary bg-accent/30"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                required
                ref={passwordRef}
                className="rounded-full border-primary/20 focus-visible:ring-primary bg-accent/30"
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" variant="gradient" disabled={isLoading}>
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

        {/* Debug component - remove in production */}
        <DebugEnv />
      </Card>
    </div>
  )
}

