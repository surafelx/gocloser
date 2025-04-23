"use client";

import Link from "next/link";
import { BarChart3, ChevronRight, MessageSquare, Upload } from "lucide-react";
import { AnimatedButton } from "@/components/ui/animated-button";
import AnimatedElement from "@/components/animated-element";
import { useEffect, useState } from "react";
import { useIsMobile } from "@/hooks/use-media-query";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const isMobile = useIsMobile();

  // Handle client-side mounting to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Scroll to section smoothly
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (!mounted) {
    return null; // Return null on server-side to prevent hydration mismatch
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <AnimatedElement type="slide-right" duration={800}>
            <div className="flex items-center gap-2 font-bold text-xl">
              <span className="text-primary">Go</span>
              <span>Closer</span>
            </div>
          </AnimatedElement>

          <nav className="hidden md:flex gap-6">
            <AnimatedElement type="fade-in" duration={800} delay={200}>
              <button
                onClick={() => scrollToSection('features')}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Features
              </button>
            </AnimatedElement>
            <AnimatedElement type="fade-in" duration={800} delay={300}>
              <button
                onClick={() => scrollToSection('how-it-works')}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                How It Works
              </button>
            </AnimatedElement>
            <AnimatedElement type="fade-in" duration={800} delay={400}>
              <button
                onClick={() => scrollToSection('pricing')}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Pricing
              </button>
            </AnimatedElement>
          </nav>

          <div className="flex items-center gap-2 sm:gap-4">
            <AnimatedElement type="slide-left" duration={800} delay={100}>
              <Link href="/login">
                <AnimatedButton
                  variant="outline"
                  className="text-sm sm:text-base"
                  animation="pop"
                  responsive
                >
                  Log In
                </AnimatedButton>
              </Link>
            </AnimatedElement>
            <AnimatedElement type="slide-left" duration={800}>
              <Link href="/signup">
                <AnimatedButton
                  variant="gradient"
                  className="text-sm sm:text-base"
                  animation="pop"
                  responsive
                >
                  Sign Up
                </AnimatedButton>
              </Link>
            </AnimatedElement>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="py-16 md:py-24 lg:py-32 container px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <AnimatedElement type="slide-down" duration={1000}>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4 md:mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-500">
                Elevate Your Sales Performance with AI
              </h1>
            </AnimatedElement>

            <AnimatedElement type="fade-in" duration={1000} delay={300}>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-6 md:mb-8 max-w-2xl mx-auto">
                Chat with our AI coach, upload your sales conversations, and get instant feedback to improve your sales
                techniques.
              </p>
            </AnimatedElement>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <AnimatedElement type="slide-up" duration={800} delay={600}>
                <Link href="/signup" className="w-full sm:w-auto">
                  <AnimatedButton
                    variant="gradient"
                    size="lg"
                    className="gap-2"
                    animation="pop"
                    responsive
                    icon={<MessageSquare className="h-4 w-4" />}
                  >
                    Start Chatting
                  </AnimatedButton>
                </Link>
              </AnimatedElement>

              <AnimatedElement type="slide-up" duration={800} delay={800}>
                <Link href="/demo" className="w-full sm:w-auto">
                  <AnimatedButton
                    variant="outline"
                    size="lg"
                    animation="pop"
                    responsive
                  >
                    See Demo
                  </AnimatedButton>
                </Link>
              </AnimatedElement>
            </div>
          </div>
        </section>

        <section id="features" className="py-12 sm:py-16 md:py-20 bg-muted/50">
          <div className="container px-4 sm:px-6 lg:px-8">
            <AnimatedElement type="fade-in" duration={800}>
              <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 md:mb-12">Key Features</h2>
            </AnimatedElement>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
              <AnimatedElement type="zoom-in" duration={800} delay={200}>
                <div className="bg-background p-5 sm:p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <div className="mb-4 p-3 bg-primary/10 w-fit rounded-full">
                    <MessageSquare className="h-5 sm:h-6 w-5 sm:w-6 text-primary animate-pulse" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold mb-2">AI Sales Coach</h3>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    Chat with our AI coach to practice sales scenarios and get real-time feedback on your techniques.
                  </p>
                </div>
              </AnimatedElement>

              <AnimatedElement type="zoom-in" duration={800} delay={400}>
                <div className="bg-background p-5 sm:p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <div className="mb-4 p-3 bg-primary/10 w-fit rounded-full">
                    <Upload className="h-5 sm:h-6 w-5 sm:w-6 text-primary animate-pulse" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold mb-2">Media Analysis</h3>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    Upload video, audio, or text files directly in chat for comprehensive AI analysis of your sales
                    conversations.
                  </p>
                </div>
              </AnimatedElement>

              <AnimatedElement type="zoom-in" duration={800} delay={600} className="sm:col-span-2 md:col-span-1 mx-auto sm:mx-0 max-w-md sm:max-w-none">
                <div className="bg-background p-5 sm:p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow h-full">
                  <div className="mb-4 p-3 bg-primary/10 w-fit rounded-full">
                    <BarChart3 className="h-5 sm:h-6 w-5 sm:w-6 text-primary animate-pulse" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold mb-2">Performance Insights</h3>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    Receive detailed performance scores and actionable feedback to improve your sales techniques.
                  </p>
                </div>
              </AnimatedElement>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="py-12 sm:py-16 md:py-20">
          <div className="container px-4 sm:px-6 lg:px-8">
            <AnimatedElement type="fade-in" duration={800}>
              <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 md:mb-12">How It Works</h2>
            </AnimatedElement>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 max-w-4xl mx-auto">
              {[1, 2, 3, 4].map((step) => (
                <AnimatedElement
                  key={step}
                  type="slide-up"
                  duration={800}
                  delay={200 * step}
                  className="h-full"
                >
                  <div className="text-center bg-background/50 p-4 sm:p-5 rounded-lg hover:shadow-sm transition-shadow h-full flex flex-col">
                    <div className="bg-primary/10 rounded-full h-10 w-10 sm:h-12 sm:w-12 flex items-center justify-center mx-auto mb-3 sm:mb-4 animate-float">
                      <span className="text-primary font-bold">{step}</span>
                    </div>
                    <h3 className="font-semibold mb-1 sm:mb-2 text-base sm:text-lg">
                      {step === 1 && "Chat with AI"}
                      {step === 2 && "Upload Content"}
                      {step === 3 && "Get Feedback"}
                      {step === 4 && "Track Progress"}
                    </h3>
                    <p className="text-muted-foreground text-sm sm:text-base flex-1">
                      {step === 1 && "Start a conversation with our AI coach to practice sales scenarios or ask for advice."}
                      {step === 2 && "Share your sales calls, presentations, or pitches directly in the chat for analysis."}
                      {step === 3 && "Receive detailed performance grades and specific recommendations for improvement."}
                      {step === 4 && "Monitor your improvement over time with detailed analytics and progress tracking."}
                    </p>
                  </div>
                </AnimatedElement>
              ))}
            </div>

            <AnimatedElement type="fade-in" duration={800} delay={1000} className="mt-12 text-center">
              <Link href="/signup">
                <AnimatedButton
                  variant="gradient"
                  size="lg"
                  animation="pop"
                  icon={<ChevronRight className="h-4 w-4" />}
                  iconPosition="right"
                >
                  Get Started Now
                </AnimatedButton>
              </Link>
            </AnimatedElement>
          </div>
        </section>
        <section id="pricing" className="py-12 sm:py-16 md:py-20 bg-muted/50">
          <div className="container px-4 sm:px-6 lg:px-8">
            <AnimatedElement type="fade-in" duration={800}>
              <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">Simple, Transparent Pricing</h2>
              <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-12">
                Choose the plan that works best for your sales team. All plans include access to our AI coach and analytics.
              </p>
            </AnimatedElement>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {[
                {
                  name: "Starter",
                  price: "$29",
                  description: "Perfect for individual sales professionals",
                  features: [
                    "Unlimited AI coaching sessions",
                    "5 media uploads per month",
                    "Basic performance analytics",
                    "Email support"
                  ]
                },
                {
                  name: "Professional",
                  price: "$79",
                  description: "Ideal for growing sales teams",
                  features: [
                    "Everything in Starter",
                    "Unlimited media uploads",
                    "Advanced performance analytics",
                    "Team collaboration features",
                    "Priority support"
                  ],
                  popular: true
                },
                {
                  name: "Enterprise",
                  price: "Custom",
                  description: "For large organizations with custom needs",
                  features: [
                    "Everything in Professional",
                    "Custom AI training",
                    "API access",
                    "Dedicated account manager",
                    "SSO and advanced security",
                    "24/7 premium support"
                  ]
                }
              ].map((plan, index) => (
                <AnimatedElement
                  key={plan.name}
                  type="zoom-in"
                  duration={800}
                  delay={300 * index}
                  className="h-full"
                >
                  <div className={`bg-background rounded-xl p-6 shadow-sm h-full flex flex-col ${plan.popular ? 'border-2 border-primary relative' : 'border border-border'}`}>
                    {plan.popular && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-primary text-white px-4 py-1 rounded-full text-sm font-medium">
                        Most Popular
                      </div>
                    )}
                    <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                    <div className="mb-4">
                      <span className="text-3xl font-bold">{plan.price}</span>
                      {plan.price !== "Custom" && <span className="text-muted-foreground">/month</span>}
                    </div>
                    <p className="text-muted-foreground mb-6">{plan.description}</p>
                    <ul className="space-y-3 mb-8 flex-1">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start">
                          <svg className="h-5 w-5 text-primary mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Link href="/signup" className="mt-auto">
                      <AnimatedButton
                        variant={plan.popular ? "gradient" : "outline"}
                        fullWidth
                        animation="pop"
                      >
                        {plan.price === "Custom" ? "Contact Sales" : "Get Started"}
                      </AnimatedButton>
                    </Link>
                  </div>
                </AnimatedElement>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-6 sm:py-8">
        <div className="container px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center">
          <AnimatedElement type="slide-right" duration={800}>
            <div className="flex items-center gap-2 font-bold text-lg sm:text-xl mb-3 md:mb-0">
              <span className="text-primary">Go</span>
              <span>Closer</span>
            </div>
          </AnimatedElement>

          <AnimatedElement type="slide-left" duration={800}>
            <div className="text-center md:text-right text-xs sm:text-sm text-muted-foreground">
              <p>© 2025 GoCloser. All rights reserved.</p>
            </div>
          </AnimatedElement>
        </div>
      </footer>
    </div>
  )
}

