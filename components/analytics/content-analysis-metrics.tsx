'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, LineChart } from '@/components/ui/charts';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mic, Video, FileText, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ContentAnalysisMetrics() {
  // Mock data for content analysis by type
  const contentTypeData = [
    { 
      type: 'Sales Calls', 
      icon: <Mic className="h-4 w-4" />,
      count: 38,
      avgScore: 76,
      improvement: 12,
      color: '#6366f1'
    },
    { 
      type: 'Video Presentations', 
      icon: <Video className="h-4 w-4" />,
      count: 23,
      avgScore: 82,
      improvement: 8,
      color: '#8b5cf6'
    },
    { 
      type: 'Email Templates', 
      icon: <FileText className="h-4 w-4" />,
      count: 56,
      avgScore: 91,
      improvement: 15,
      color: '#d946ef'
    },
  ];

  // Mock data for content scores over time
  const scoresTrendData = [
    { date: '2025-03-01', calls: 68, videos: 75, emails: 82 },
    { date: '2025-03-15', calls: 70, videos: 78, emails: 85 },
    { date: '2025-04-01', calls: 73, videos: 80, emails: 88 },
    { date: '2025-04-15', calls: 75, videos: 81, emails: 90 },
    { date: '2025-05-01', calls: 76, videos: 82, emails: 91 },
  ];

  // Mock data for common strengths and weaknesses
  const strengthsData = [
    { name: 'Product Knowledge', count: 32 },
    { name: 'Clear Communication', count: 28 },
    { name: 'Building Rapport', count: 25 },
    { name: 'Value Articulation', count: 22 },
  ];

  const weaknessesData = [
    { name: 'Handling Objections', count: 24 },
    { name: 'Closing Techniques', count: 20 },
    { name: 'Active Listening', count: 18 },
    { name: 'Concise Messaging', count: 15 },
  ];

  // Mock data for recent analyses
  const recentAnalyses = [
    {
      id: 1,
      name: 'Enterprise Client Call',
      type: 'Sales Call',
      date: '2 days ago',
      score: 82,
      icon: <Mic className="h-4 w-4" />,
      strengths: ['Product knowledge', 'Building rapport'],
      weaknesses: ['Handling price objections', 'Closing techniques']
    },
    {
      id: 2,
      name: 'Product Demo - New Feature',
      type: 'Video',
      date: '5 days ago',
      score: 76,
      icon: <Video className="h-4 w-4" />,
      strengths: ['Feature explanation', 'Use case examples'],
      weaknesses: ['Technical clarity', 'Addressing customer needs']
    },
    {
      id: 3,
      name: 'Follow-up Email Template',
      type: 'Email',
      date: '1 week ago',
      score: 91,
      icon: <FileText className="h-4 w-4" />,
      strengths: ['Clear call-to-action', 'Personalization', 'Concise messaging'],
      weaknesses: ['Value proposition']
    },
  ];

  return (
    <Card className="border-primary/20 shadow-md hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
      <CardHeader>
        <CardTitle>Content Analysis Metrics</CardTitle>
        <CardDescription>
          Performance metrics for your analyzed sales content
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview">
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="strengths">Strengths & Weaknesses</TabsTrigger>
            <TabsTrigger value="recent">Recent Analyses</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {contentTypeData.map((content) => (
                <div key={content.type} className="bg-accent/20 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <div className="p-2 rounded-full bg-primary/10 mr-2">
                      {content.icon}
                    </div>
                    <span className="font-medium">{content.type}</span>
                  </div>
                  <div className="flex items-baseline mb-2">
                    <span className="text-2xl font-bold mr-2">{content.avgScore}/100</span>
                    <Badge className="bg-green-500/20 text-green-600 hover:bg-green-500/30">
                      +{content.improvement}%
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mb-2">
                    Based on {content.count} analyzed {content.type.toLowerCase()}
                  </div>
                  <Progress 
                    value={content.avgScore} 
                    className="h-1.5" 
                    style={{ '--progress-color': content.color } as React.CSSProperties} 
                  />
                </div>
              ))}
            </div>

            <div className="h-[300px]">
              <LineChart
                data={scoresTrendData}
                categories={['calls', 'videos', 'emails']}
                index="date"
                colors={['primary', 'indigo', 'violet']}
                valueFormatter={(value) => `${value}/100`}
                showLegend={true}
                showGridLines={true}
                showAnimation={true}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="strengths">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center mb-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <h4 className="text-sm font-medium">Common Strengths</h4>
                </div>
                <div className="h-[250px]">
                  <BarChart
                    data={strengthsData}
                    categories={['count']}
                    index="name"
                    colors={['green']}
                    valueFormatter={(value) => `${value} mentions`}
                    showLegend={false}
                    showGridLines={true}
                    showAnimation={true}
                  />
                </div>
              </div>
              
              <div>
                <div className="flex items-center mb-3">
                  <XCircle className="h-5 w-5 text-red-500 mr-2" />
                  <h4 className="text-sm font-medium">Common Areas to Improve</h4>
                </div>
                <div className="h-[250px]">
                  <BarChart
                    data={weaknessesData}
                    categories={['count']}
                    index="name"
                    colors={['red']}
                    valueFormatter={(value) => `${value} mentions`}
                    showLegend={false}
                    showGridLines={true}
                    showAnimation={true}
                  />
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="recent">
            <div className="space-y-4">
              {recentAnalyses.map((analysis) => (
                <div key={analysis.id} className="rounded-xl border border-primary/10 p-4 bg-accent/20 hover:bg-accent/30 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-primary/10 p-2 rounded-full">
                      {analysis.icon}
                    </div>
                    <div>
                      <p className="font-medium">{analysis.name}</p>
                      <p className="text-sm text-muted-foreground">Analyzed {analysis.date}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Overall Score</span>
                      <span className="font-medium bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-400">
                        {analysis.score}/100
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm">Strengths:</span>
                        <ul className="text-sm text-muted-foreground ml-5 list-disc">
                          {analysis.strengths.map((strength, index) => (
                            <li key={index}>{strength}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <span className="text-sm">Areas to Improve:</span>
                        <ul className="text-sm text-muted-foreground ml-5 list-disc">
                          {analysis.weaknesses.map((weakness, index) => (
                            <li key={index}>{weakness}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
