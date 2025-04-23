'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, LineChart } from '@/components/ui/charts';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Zap, MessageSquare, FileText, Video, Mic, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AiUsageMetrics() {
  // Mock data for token usage
  const tokenUsage = {
    total: 1250000,
    limit: 2000000,
    promptTokens: 750000,
    completionTokens: 500000,
    estimatedCost: 12.75
  };

  // Calculate percentages
  const usagePercentage = Math.round((tokenUsage.total / tokenUsage.limit) * 100);
  
  // Mock data for token usage over time
  const tokenUsageData = [
    { date: '2025-03-15', total: 85000, prompt: 50000, completion: 35000 },
    { date: '2025-03-22', total: 95000, prompt: 55000, completion: 40000 },
    { date: '2025-03-29', total: 110000, prompt: 65000, completion: 45000 },
    { date: '2025-04-05', total: 105000, prompt: 62000, completion: 43000 },
    { date: '2025-04-12', total: 120000, prompt: 72000, completion: 48000 },
  ];

  // Mock data for interaction types
  const interactionTypes = [
    { 
      name: 'Chat Messages', 
      count: 842, 
      icon: <MessageSquare className="h-4 w-4" />, 
      change: 12,
      color: '#6366f1'
    },
    { 
      name: 'Text Analysis', 
      count: 56, 
      icon: <FileText className="h-4 w-4" />, 
      change: 8,
      color: '#8b5cf6'
    },
    { 
      name: 'Video Analysis', 
      count: 23, 
      icon: <Video className="h-4 w-4" />, 
      change: 15,
      color: '#d946ef'
    },
    { 
      name: 'Audio Analysis', 
      count: 38, 
      icon: <Mic className="h-4 w-4" />, 
      change: 22,
      color: '#ec4899'
    },
  ];

  // Mock data for interactions over time
  const interactionData = [
    { date: '2025-03-15', chat: 150, text: 10, video: 4, audio: 6 },
    { date: '2025-03-22', chat: 165, text: 12, video: 5, audio: 7 },
    { date: '2025-03-29', chat: 180, text: 11, video: 4, audio: 8 },
    { date: '2025-04-05', chat: 170, text: 13, video: 5, audio: 9 },
    { date: '2025-04-12', chat: 190, text: 14, video: 6, audio: 10 },
  ];

  return (
    <Card className="border-primary/20 shadow-md hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
      <CardHeader>
        <CardTitle>AI Usage Metrics</CardTitle>
        <CardDescription>
          Track your AI interactions and token usage
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="interactions">
          <TabsList className="mb-4">
            <TabsTrigger value="interactions">Interactions</TabsTrigger>
            <TabsTrigger value="tokens">Token Usage</TabsTrigger>
          </TabsList>
          
          <TabsContent value="interactions">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {interactionTypes.map((type) => (
                <div key={type.name} className="bg-accent/20 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <div className="p-2 rounded-full bg-primary/10 mr-2">
                      {type.icon}
                    </div>
                    <span className="font-medium">{type.name}</span>
                  </div>
                  <div className="flex items-baseline">
                    <span className="text-2xl font-bold mr-2">{type.count}</span>
                    <span className="text-xs text-green-500">+{type.change}%</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="h-[350px]">
              <AreaChart
                data={interactionData}
                categories={['chat', 'text', 'video', 'audio']}
                index="date"
                colors={['primary', 'indigo', 'violet', 'pink']}
                valueFormatter={(value) => `${value}`}
                showLegend={true}
                showGridLines={true}
                showAnimation={true}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="tokens">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-accent/20 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <div className="p-2 rounded-full bg-primary/10 mr-2">
                    <Zap className="h-4 w-4 text-primary" />
                  </div>
                  <span className="font-medium">Total Tokens</span>
                </div>
                <div className="text-2xl font-bold mb-2">{(tokenUsage.total / 1000).toFixed(1)}K</div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">
                      {tokenUsage.total.toLocaleString()} / {tokenUsage.limit.toLocaleString()} tokens
                    </span>
                    <span className="font-medium">
                      {usagePercentage}%
                    </span>
                  </div>
                  <Progress value={usagePercentage} className="h-1.5 bg-secondary/30" />
                </div>
              </div>
              
              <div className="bg-accent/20 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <div className="p-2 rounded-full bg-primary/10 mr-2">
                    <MessageSquare className="h-4 w-4 text-primary" />
                  </div>
                  <span className="font-medium">Token Breakdown</span>
                </div>
                <div className="space-y-3 mt-2">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Prompt Tokens</span>
                      <span className="font-medium">{(tokenUsage.promptTokens / 1000).toFixed(1)}K</span>
                    </div>
                    <Progress value={60} className="h-1.5" style={{ '--progress-color': '#6366f1' } as React.CSSProperties} />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Completion Tokens</span>
                      <span className="font-medium">{(tokenUsage.completionTokens / 1000).toFixed(1)}K</span>
                    </div>
                    <Progress value={40} className="h-1.5" style={{ '--progress-color': '#8b5cf6' } as React.CSSProperties} />
                  </div>
                </div>
              </div>
              
              <div className="bg-accent/20 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <div className="p-2 rounded-full bg-primary/10 mr-2">
                    <DollarSign className="h-4 w-4 text-primary" />
                  </div>
                  <span className="font-medium">Estimated Cost</span>
                </div>
                <div className="text-2xl font-bold mb-2">${tokenUsage.estimatedCost.toFixed(2)}</div>
                <div className="text-xs text-muted-foreground">
                  Based on Gemini Pro pricing
                </div>
              </div>
            </div>

            <div className="h-[350px]">
              <LineChart
                data={tokenUsageData}
                categories={['total', 'prompt', 'completion']}
                index="date"
                colors={['primary', 'indigo', 'violet']}
                valueFormatter={(value) => `${value.toLocaleString()}`}
                showLegend={true}
                showGridLines={true}
                showAnimation={true}
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
