'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { MessageSquare, FileText, Mic, Video, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { useChat } from '@/contexts/chat-context';

interface ChatAnalysisProps {
  className?: string;
}

interface AnalysisResult {
  id: string;
  title: string;
  date: string;
  overallScore: number;
  metrics: {
    name: string;
    score: number;
    description: string;
  }[];
  strengths: string[];
  improvements: string[];
  type: 'text' | 'audio' | 'video' | 'file';
  status: 'complete' | 'analyzing' | 'error';
}

export function ChatAnalysis({ className }: ChatAnalysisProps) {
  const { toast } = useToast();
  const { chats, messages } = useChat();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisResult | null>(null);

  // Simulate loading saved analysis results
  useEffect(() => {
    // This would be replaced with an actual API call to get saved analyses
    const mockResults: AnalysisResult[] = [
      {
        id: '1',
        title: 'Sales Pitch Analysis',
        date: '2023-10-15',
        overallScore: 82,
        metrics: [
          { name: 'Clarity', score: 85, description: 'How clearly you communicate your message' },
          { name: 'Engagement', score: 78, description: 'How well you engage with the prospect' },
          { name: 'Objection Handling', score: 65, description: 'How effectively you address concerns' },
          { name: 'Closing Technique', score: 88, description: 'How well you close the deal' },
        ],
        strengths: [
          'Strong product knowledge',
          'Excellent rapport building',
          'Clear value proposition',
        ],
        improvements: [
          'Could improve handling of price objections',
          'Need more specific examples',
        ],
        type: 'text',
        status: 'complete',
      },
      {
        id: '2',
        title: 'Client Call Recording',
        date: '2023-10-10',
        overallScore: 76,
        metrics: [
          { name: 'Clarity', score: 70, description: 'How clearly you communicate your message' },
          { name: 'Engagement', score: 82, description: 'How well you engage with the prospect' },
          { name: 'Objection Handling', score: 68, description: 'How effectively you address concerns' },
          { name: 'Closing Technique', score: 75, description: 'How well you close the deal' },
        ],
        strengths: [
          'Good listening skills',
          'Personalized approach',
        ],
        improvements: [
          'Need to be more concise',
          'Could improve technical explanations',
          'More emphasis on benefits vs features',
        ],
        type: 'audio',
        status: 'complete',
      },
    ];
    
    setAnalysisResults(mockResults);
  }, []);

  const analyzeChats = async () => {
    setIsAnalyzing(true);
    
    // This would be replaced with actual API calls to analyze chats
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Add a new analysis result
      const newAnalysis: AnalysisResult = {
        id: Date.now().toString(),
        title: 'Recent Chat Analysis',
        date: new Date().toISOString().split('T')[0],
        overallScore: Math.floor(Math.random() * 30) + 70, // Random score between 70-100
        metrics: [
          { name: 'Clarity', score: Math.floor(Math.random() * 30) + 70, description: 'How clearly you communicate your message' },
          { name: 'Engagement', score: Math.floor(Math.random() * 30) + 70, description: 'How well you engage with the prospect' },
          { name: 'Objection Handling', score: Math.floor(Math.random() * 30) + 70, description: 'How effectively you address concerns' },
          { name: 'Closing Technique', score: Math.floor(Math.random() * 30) + 70, description: 'How well you close the deal' },
        ],
        strengths: [
          'Effective questioning techniques',
          'Good follow-up strategy',
          'Clear explanation of benefits',
        ],
        improvements: [
          'Could provide more social proof',
          'Need to address objections more directly',
        ],
        type: 'text',
        status: 'complete',
      };
      
      setAnalysisResults(prev => [newAnalysis, ...prev]);
      setSelectedAnalysis(newAnalysis);
      
      toast({
        title: 'Analysis Complete',
        description: 'Your chat history has been analyzed successfully.',
      });
    } catch (error) {
      toast({
        title: 'Analysis Failed',
        description: 'There was an error analyzing your chat history.',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 75) return 'text-blue-500';
    if (score >= 60) return 'text-amber-500';
    return 'text-red-500';
  };

  const getProgressColor = (score: number) => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 75) return 'bg-blue-500';
    if (score >= 60) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'audio':
        return <Mic className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'file':
        return <FileText className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Chat Analysis</h2>
        <Button 
          onClick={analyzeChats} 
          disabled={isAnalyzing}
          className="rounded-full"
        >
          {isAnalyzing ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Analyze Chats
            </>
          )}
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Analysis List */}
        <Card className={`lg:col-span-1 ${className}`}>
          <CardHeader>
            <CardTitle>Analysis History</CardTitle>
            <CardDescription>Previous chat analyses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analysisResults.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No analyses yet. Click "Analyze Chats" to get started.</p>
                </div>
              ) : (
                analysisResults.map((analysis) => (
                  <div 
                    key={analysis.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                      selectedAnalysis?.id === analysis.id ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                    onClick={() => setSelectedAnalysis(analysis)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="bg-primary/10 p-1.5 rounded-full">
                          {getTypeIcon(analysis.type)}
                        </div>
                        <div>
                          <p className="font-medium">{analysis.title}</p>
                          <p className="text-xs text-muted-foreground">{analysis.date}</p>
                        </div>
                      </div>
                      <Badge className={`${getScoreColor(analysis.overallScore)} bg-primary/10`}>
                        {analysis.overallScore}/100
                      </Badge>
                    </div>
                    
                    {analysis.status === 'analyzing' && (
                      <div className="mt-2">
                        <p className="text-xs text-muted-foreground mb-1">Analyzing...</p>
                        <Progress value={45} className="h-1" />
                      </div>
                    )}
                    
                    {analysis.status === 'error' && (
                      <div className="mt-2 flex items-center text-red-500 text-xs">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Analysis failed
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Analysis Details */}
        <Card className="lg:col-span-2">
          {selectedAnalysis ? (
            <>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>{selectedAnalysis.title}</CardTitle>
                    <CardDescription>Analyzed on {selectedAnalysis.date}</CardDescription>
                  </div>
                  <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
                    {selectedAnalysis.overallScore}/100
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="metrics">
                  <TabsList className="mb-4">
                    <TabsTrigger value="metrics">Metrics</TabsTrigger>
                    <TabsTrigger value="strengths">Strengths</TabsTrigger>
                    <TabsTrigger value="improvements">Areas to Improve</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="metrics" className="space-y-4">
                    {selectedAnalysis.metrics.map((metric) => (
                      <div key={metric.name} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{metric.name}</p>
                            <p className="text-xs text-muted-foreground">{metric.description}</p>
                          </div>
                          <span className={`font-bold ${getScoreColor(metric.score)}`}>
                            {metric.score}/100
                          </span>
                        </div>
                        <Progress 
                          value={metric.score} 
                          className="h-2"
                          style={{ 
                            '--progress-background': 'hsl(var(--muted))',
                            '--progress-foreground': getProgressColor(metric.score)
                          } as React.CSSProperties}
                        />
                      </div>
                    ))}
                  </TabsContent>
                  
                  <TabsContent value="strengths">
                    <div className="space-y-2">
                      {selectedAnalysis.strengths.map((strength, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                          <p>{strength}</p>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="improvements">
                    <div className="space-y-2">
                      {selectedAnalysis.improvements.map((improvement, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                          <p>{improvement}</p>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
                
                <Separator className="my-6" />
                
                <div className="space-y-4">
                  <h3 className="font-medium">Improvement Suggestions</h3>
                  <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                    <p className="text-sm">
                      Based on your chat history, here are some suggestions to improve your sales approach:
                    </p>
                    <ul className="mt-2 space-y-2 text-sm ml-5 list-disc">
                      <li>Focus more on asking open-ended questions to better understand customer needs</li>
                      <li>Provide more specific examples of how your product has helped similar customers</li>
                      <li>When handling objections, acknowledge concerns before addressing them</li>
                      <li>Use more social proof in your conversations to build credibility</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </>
          ) : (
            <div className="flex items-center justify-center h-full py-20">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Analysis Selected</h3>
                <p className="text-muted-foreground max-w-md">
                  Select an analysis from the list or click "Analyze Chats" to generate a new analysis of your chat history.
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
