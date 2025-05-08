"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Send, LogIn } from "lucide-react";
import { AnimatedButton } from "@/components/ui/animated-button";
import { Button } from "@/components/ui/button";
import AnimatedElement from "@/components/animated-element";
import { useIsMobile } from "@/hooks/use-media-query";
import Link from "next/link";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [input, setInput] = useState("");
  const [typingText, setTypingText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const isMobile = useIsMobile();
  const router = useRouter();
  const typingInterval = useRef<NodeJS.Timeout | null>(null);

  const salesQuestions = [
    "How can I improve my cold calling conversion rate?",
    "What's the best way to handle price objections?",
    "How do I create a compelling sales pitch for our new product?",
    "What closing techniques work best for enterprise clients?",
    "How can I build rapport with potential clients faster?",
    "What follow-up strategy would you recommend after a demo?",
    "How do I identify the decision maker in a large organization?",
  ];

  // Handle client-side mounting to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-typing effect
  useEffect(() => {
    if (!mounted) return;

    let currentQuestionIndex = 0;
    let currentCharIndex = 0;
    let isDeleting = false;
    let typingSpeed = 70; // Base typing speed in ms
    let pauseTime = 1500; // Time to pause after completing a question

    const typeNextChar = () => {
      const currentQuestion = salesQuestions[currentQuestionIndex];

      if (isDeleting) {
        // Deleting characters
        setTypingText(prev => prev.substring(0, prev.length - 1));
        typingSpeed = 30; // Faster when deleting

        if (typingText.length === 0) {
          isDeleting = false;
          currentQuestionIndex = (currentQuestionIndex + 1) % salesQuestions.length;
          typingSpeed = 70; // Reset typing speed
        }
      } else {
        // Typing characters
        setTypingText(currentQuestion.substring(0, currentCharIndex + 1));
        currentCharIndex++;
        typingSpeed = 70 + Math.random() * 50; // Slight variation in typing speed

        if (currentCharIndex >= currentQuestion.length) {
          isDeleting = true;
          currentCharIndex = 0;
          typingSpeed = pauseTime; // Pause before deleting
        }
      }

      // Schedule the next update
      setTimeout(typeNextChar, typingSpeed);
    };

    // Start the typing effect
    const timer = setTimeout(typeNextChar, 500);

    return () => {
      clearTimeout(timer);
    };
  }, [mounted]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      router.push('/pricing');
    }
  };

  if (!mounted) {
    return null; // Return null on server-side to prevent hydration mismatch
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px]" />

      <header className="fixed top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <AnimatedElement type="slide-right" duration={800}>
            <div className="flex items-center gap-2 font-bold text-xl">
              <span className="text-primary">Go</span>
              <span>Closer</span>
            </div>
          </AnimatedElement>

          <AnimatedElement type="slide-left" duration={800}>
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="outline" size="sm" className="rounded-full px-4">
                  <LogIn className="h-4 w-4 mr-2" />
                  Login
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="gradient" size="sm" className="rounded-full px-4">
                  Register
                </Button>
              </Link>
            </div>
          </AnimatedElement>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center w-full max-w-3xl px-4 sm:px-6">
        <AnimatedElement type="fade-in" duration={800} className="w-full">
          <div className="text-center mb-6">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-500 mb-3">
              GoCloser
            </h1>
            <h2 className="text-3xl sm:text-3xl font-bold tracking-tight bg-clip-text text-white mb-3">
              Your AI Sales Coach
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-4">
              GoCloser helps sales professionals improve their techniques, handle objections,
              and close more deals with personalized AI coaching.
            </p>
          </div>

          <div className="mb-8 h-16 flex items-center justify-center">
            <div className="text-xl sm:text-2xl font-medium text-foreground/80 flex items-center">
             
              <span className="text-primary min-h-[2rem] inline-flex items-center">
                {typingText}
                <span className={`ml-0.5 h-5 w-0.5 bg-primary inline-block ${isTyping ? 'animate-blink' : 'opacity-0'}`}></span>
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="w-full">
            <div className="relative w-full rounded-xl border border-primary/20 bg-accent/30 shadow-sm focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your sales question or scenario..."
                className="w-full resize-none bg-transparent px-4 py-3 text-base focus:outline-none min-h-[100px] rounded-xl"
                rows={4}
              />

              <div className="absolute bottom-2 right-2">
                <AnimatedButton
                  type="submit"
                  size="icon"
                  disabled={!input.trim()}
                  variant="gradient"
                  className="rounded-full w-9 h-9 sm:w-10 sm:h-10"
                  animation="pop"
                  ripple
                >
                  <Send className="h-4 w-4" />
                </AnimatedButton>
              </div>
            </div>
          </form>

          <div className="mt-8 text-center">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-bold">1</span>
                </div>
                <span className="text-sm">Ask any sales question</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-bold">2</span>
                </div>
                <span className="text-sm">Get personalized coaching</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-bold">3</span>
                </div>
                <span className="text-sm">Improve your sales skills</span>
              </div>
            </div>
          </div>
        </AnimatedElement>
      </main>

      <footer className="w-full py-4 border-t">
        <div className="container flex justify-center text-xs text-muted-foreground">
          <p>© 2025 GoCloser. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
