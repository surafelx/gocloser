"use client"

import { useState, useEffect } from "react"
import AppLayout from "@/components/app-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Mic, Video, BarChart3, MessageSquare, ArrowUpDown, Loader2 } from "lucide-react"
import { ChatAnalysis } from "@/components/analytics/chat-analysis"
import { useToast } from "@/components/ui/use-toast"

interface AnalyticsData {
  totalChats: number;
  chatsWithAttachments: number;
  totalMessages: number;
  userMessages: number;
  aiMessages: number;
  messageTypePercentages: {
    text: number;
    audio: number;
    video: number;
    file: number;
  };
  topics: {
    topic: string;
    percentage: number;
  }[];
}

export default function AnalyticsPage() {
  const { toast } = useToast()
  const [timeRange, setTimeRange] = useState("30days")
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch analytics data when timeRange changes
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/analytics?timeRange=${timeRange}`)

        if (!response.ok) {
          throw new Error('Failed to fetch analytics data')
        }

        const data = await response.json()

        if (data.success && data.analytics) {
          setAnalyticsData(data.analytics)
        } else {
          throw new Error('Invalid response from server')
        }
      } catch (error) {
        console.error('Error fetching analytics data:', error)
        toast({
          title: 'Error',
          description: 'Failed to load analytics data. Please try again.',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnalyticsData()
  }, [timeRange, toast])

  return (
    <AppLayout>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-400">
            Chat Analytics
          </h1>
          <p className="text-muted-foreground">Analyze your chat history and track your improvement over time</p>
        </div>

        <div className="flex justify-end mb-6">
          <div className="inline-flex rounded-full shadow-sm bg-accent p-1">
            <Button
              variant={timeRange === "7days" ? "gradient" : "ghost"}
              size="sm"
              className="rounded-full"
              onClick={() => setTimeRange("7days")}
            >
              7 Days
            </Button>
            <Button
              variant={timeRange === "30days" ? "gradient" : "ghost"}
              size="sm"
              className="rounded-full"
              onClick={() => setTimeRange("30days")}
            >
              30 Days
            </Button>
            <Button
              variant={timeRange === "90days" ? "gradient" : "ghost"}
              size="sm"
              className="rounded-full"
              onClick={() => setTimeRange("90days")}
            >
              90 Days
            </Button>
          </div>
        </div>

        <Tabs defaultValue="chat-analysis">
          <TabsList className="mb-6 rounded-full p-1 bg-accent">
            <TabsTrigger
              value="chat-analysis"
              className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-white"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Chat Analysis
            </TabsTrigger>
            <TabsTrigger
              value="progress"
              className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-white"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Progress Tracking
            </TabsTrigger>
            <TabsTrigger
              value="trends"
              className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-white"
            >
              <ArrowUpDown className="h-4 w-4 mr-2" />
              Trends
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat-analysis" className="space-y-6">
            <ChatAnalysis className="border-primary/20 shadow-md hover:shadow-xl hover:shadow-primary/5 transition-all duration-300" />
          </TabsContent>

          <TabsContent value="progress" className="space-y-6">
            <Card className="border-primary/20 shadow-md hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
              <CardHeader>
                <CardTitle>Progress Tracking</CardTitle>
                <CardDescription>Track your improvement over time</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : analyticsData ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <Card className="bg-accent/20">
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <div className="text-4xl font-bold text-primary mb-2">{analyticsData.totalChats}</div>
                            <p className="text-sm text-muted-foreground">Total Chats</p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-accent/20">
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <div className="text-4xl font-bold text-primary mb-2">{analyticsData.chatsWithAttachments}</div>
                            <p className="text-sm text-muted-foreground">Chats with Attachments</p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-accent/20">
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <div className="text-4xl font-bold text-primary mb-2">{analyticsData.totalMessages}</div>
                            <p className="text-sm text-muted-foreground">Total Messages</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="p-6 border rounded-lg bg-card">
                      <h3 className="text-lg font-medium mb-4">Message Distribution</h3>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">User Messages</span>
                            <span className="text-sm text-blue-500">
                              {analyticsData.userMessages} ({Math.round((analyticsData.userMessages / analyticsData.totalMessages) * 100)}%)
                            </span>
                          </div>
                          <div className="h-2 bg-accent rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500"
                              style={{ width: `${Math.round((analyticsData.userMessages / analyticsData.totalMessages) * 100)}%` }}
                            ></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">AI Responses</span>
                            <span className="text-sm text-green-500">
                              {analyticsData.aiMessages} ({Math.round((analyticsData.aiMessages / analyticsData.totalMessages) * 100)}%)
                            </span>
                          </div>
                          <div className="h-2 bg-accent rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-500"
                              style={{ width: `${Math.round((analyticsData.aiMessages / analyticsData.totalMessages) * 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No analytics data available. Try changing the time range or start more chats.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <Card className="border-primary/20 shadow-md hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
              <CardHeader>
                <CardTitle>Usage Trends</CardTitle>
                <CardDescription>How you've been using the AI coach</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : analyticsData ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="flex items-center p-4 border rounded-lg">
                        <div className="bg-primary/10 p-3 rounded-full mr-4">
                          <MessageSquare className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Text Chats</p>
                          <p className="text-2xl font-bold">{analyticsData.messageTypePercentages.text}%</p>
                        </div>
                      </div>
                      <div className="flex items-center p-4 border rounded-lg">
                        <div className="bg-primary/10 p-3 rounded-full mr-4">
                          <Mic className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Voice Recordings</p>
                          <p className="text-2xl font-bold">{analyticsData.messageTypePercentages.audio}%</p>
                        </div>
                      </div>
                      <div className="flex items-center p-4 border rounded-lg">
                        <div className="bg-primary/10 p-3 rounded-full mr-4">
                          <FileText className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">File Uploads</p>
                          <p className="text-2xl font-bold">{analyticsData.messageTypePercentages.file}%</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 border rounded-lg bg-card">
                      <h3 className="text-lg font-medium mb-4">Most Common Topics</h3>
                      <div className="space-y-3">
                        {analyticsData.topics.map((topic, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <span className="text-sm">{topic.topic}</span>
                            <Badge className="bg-primary/10 text-primary">{topic.percentage}%</Badge>
                          </div>
                        ))}
                        {analyticsData.topics.length === 0 && (
                          <div className="text-center py-4 text-muted-foreground">
                            <p>No topic data available yet.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No analytics data available. Try changing the time range or start more chats.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}

