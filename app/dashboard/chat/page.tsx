"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import DashboardLayout from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Mic, MicOff, Send } from "lucide-react"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hi there! I'm your AI sales coach. How can I help you improve your sales skills today?",
    },
  ])
  const [input, setInput] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    // Simulate AI response
    setTimeout(() => {
      // This would be replaced with actual AI processing using Google Gemini API
      const aiResponses = [
        "That's a great question about handling objections. When a prospect raises concerns about price, try acknowledging their concern first, then focus on the value your solution provides rather than defending the price.",
        "I noticed you're using a lot of filler words in your pitch. Try practicing with more concise statements and focus on the key benefits that matter most to this specific customer segment.",
        "Your closing technique could be stronger. Instead of asking 'Does that sound good?', try a more assumptive close like 'When would you like to get started?' or offer specific next steps.",
        "Great job explaining the product features! To make it even more effective, try connecting each feature to a specific benefit that addresses the customer's pain points you identified earlier.",
      ]

      const randomResponse = aiResponses[Math.floor(Math.random() * aiResponses.length)]

      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: randomResponse,
      }

      setMessages((prev) => [...prev, assistantMessage])
      setIsLoading(false)
    }, 1500)
  }

  const toggleRecording = () => {
    setIsRecording(!isRecording)
    // This would be replaced with actual audio recording functionality
    if (!isRecording) {
      // Start recording
      console.log("Started recording")
    } else {
      // Stop recording and process audio
      console.log("Stopped recording")
      setIsLoading(true)

      // Simulate processing and response
      setTimeout(() => {
        const userMessage: Message = {
          id: Date.now().toString(),
          role: "user",
          content: "How do I handle a customer who says our product is too expensive?",
        }

        setMessages((prev) => [...prev, userMessage])

        setTimeout(() => {
          const assistantMessage: Message = {
            id: Date.now().toString(),
            role: "assistant",
            content:
              "When a customer objects to price, don't immediately offer discounts. Instead, reframe the conversation around value. Ask questions to understand their budget constraints and specific needs, then highlight the ROI and specific features that address their pain points. Sometimes, offering flexible payment terms can be more effective than reducing the price.",
          }

          setMessages((prev) => [...prev, assistantMessage])
          setIsLoading(false)
        }, 1500)
      }, 1000)
    }
  }

  return (
    <DashboardLayout>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">AI Sales Coach</h1>
          <p className="text-muted-foreground">Practice your sales skills and get real-time feedback</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Chat with AI Coach</CardTitle>
              <CardDescription>Ask questions or practice your sales pitch</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col h-[60vh]">
                <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`flex gap-3 max-w-[80%] ${message.role === "user" ? "flex-row-reverse" : ""}`}>
                        <Avatar className="h-8 w-8">
                          {message.role === "assistant" ? (
                            <>
                              <AvatarImage src="/placeholder.svg?height=32&width=32" alt="AI" />
                              <AvatarFallback>AI</AvatarFallback>
                            </>
                          ) : (
                            <>
                              <AvatarImage src="/placeholder.svg?height=32&width=32" alt="You" />
                              <AvatarFallback>You</AvatarFallback>
                            </>
                          )}
                        </Avatar>
                        <div
                          className={`rounded-lg p-3 ${
                            message.role === "assistant" ? "bg-muted" : "bg-primary text-primary-foreground"
                          }`}
                        >
                          {message.content}
                        </div>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="flex gap-3 max-w-[80%]">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src="/placeholder.svg?height=32&width=32" alt="AI" />
                          <AvatarFallback>AI</AvatarFallback>
                        </Avatar>
                        <div className="rounded-lg p-3 bg-muted">
                          <div className="flex gap-1">
                            <div className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Button
                    type="button"
                    variant={isRecording ? "destructive" : "outline"}
                    size="icon"
                    onClick={toggleRecording}
                    disabled={isLoading}
                  >
                    {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                  <Input
                    placeholder="Type your message..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={isLoading || isRecording}
                  />
                  <Button type="submit" size="icon" disabled={!input.trim() || isLoading}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Practice Scenarios</CardTitle>
              <CardDescription>Try these common sales scenarios</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start text-left h-auto py-3 px-4"
                  onClick={() => {
                    setInput("How do I handle price objections?")
                  }}
                >
                  Handling price objections
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left h-auto py-3 px-4"
                  onClick={() => {
                    setInput("Help me craft a compelling value proposition")
                  }}
                >
                  Crafting value propositions
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left h-auto py-3 px-4"
                  onClick={() => {
                    setInput("What are effective closing techniques?")
                  }}
                >
                  Closing techniques
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left h-auto py-3 px-4"
                  onClick={() => {
                    setInput("How do I qualify prospects effectively?")
                  }}
                >
                  Qualifying prospects
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left h-auto py-3 px-4"
                  onClick={() => {
                    setInput(
                      "Give me feedback on this pitch: Our solution helps businesses increase revenue by optimizing their sales process",
                    )
                  }}
                >
                  Evaluate my sales pitch
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}

