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

export default function SignupPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { googleAuth, login } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Google client ID from environment variable
  const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""

  useEffect(() => {
    // Log the Google Client ID for debugging
    if (!GOOGLE_CLIENT_ID) {
      console.warn("Google Client ID is not configured. Google signup will not work.")
    }
  }, [])

  // Form refs
  const firstNameRef = useRef<HTMLInputElement>(null)
  const lastNameRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      // Get form values
      const firstName = firstNameRef.current?.value
      const lastName = lastNameRef.current?.value
      const email = emailRef.current?.value
      const password = passwordRef.current?.value

      if (!firstName || !lastName || !email || !password) {
        setError('Please fill in all fields')
        setIsLoading(false)
        return
      }

      // Combine first and last name
      const name = `${firstName} ${lastName}`

      // Call the signup API
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Signup failed')
      }

      // Success - now login with the created credentials to ensure proper auth state
      toast({
        title: "Account created successfully",
        description: "Welcome to GoCloser!",
      })

      // Login with the created credentials
      try {
        await login(email, password);
        // The login function will handle the redirect
      } catch (loginError) {
        console.error('Auto-login after signup failed:', loginError);
        // If auto-login fails, still redirect to chat
        router.push('/chat');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during signup')
      console.error('Signup error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    setError(null)
    setIsLoading(true)

    try {
      if (!GOOGLE_CLIENT_ID) {
        throw new Error('Google Client ID is not configured')
      }

      console.log('Initiating Google signup with client ID:', GOOGLE_CLIENT_ID)

      // Handle Google login with our utility function
      await initiateGoogleLogin(GOOGLE_CLIENT_ID,
        async (response) => {
          try {
            console.log('Google signup response received:', response ? 'success' : 'failed')

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
              title: "Account created successfully",
              description: "Welcome to GoCloser!",
            })

            router.push('/chat')
          } catch (error: any) {
            console.error('Error processing Google signup:', error)
            setError(error.message || 'Failed to process Google signup')
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
      console.error('Google signup initialization error:', err)
      setError(err.message || 'An error occurred during Google signup')
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
          <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
          <CardDescription>Sign up to start improving your sales performance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" className="w-full rounded-full" onClick={handleGoogleSignup} disabled={isLoading}>
            <Google className="mr-2 h-4 w-4" />
            Sign up with Google
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First name</Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  required
                  ref={firstNameRef}
                  className="rounded-full border-primary/20 focus-visible:ring-primary bg-accent/30"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  required
                  ref={lastNameRef}
                  className="rounded-full border-primary/20 focus-visible:ring-primary bg-accent/30"
                  disabled={isLoading}
                />
              </div>
            </div>
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
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                ref={passwordRef}
                className="rounded-full border-primary/20 focus-visible:ring-primary bg-accent/30"
                disabled={isLoading}
                minLength={6}
              />
              <p className="text-xs text-muted-foreground">Password must be at least 6 characters long</p>
            </div>
            <Button type="submit" className="w-full" variant="gradient" disabled={isLoading}>
              {isLoading ? "Creating account..." : "Create account"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Log in
            </Link>
          </p>
        </CardFooter>

        {/* Debug component - remove in production */}
        <DebugEnv />
      </Card>
    </div>
  )
}

