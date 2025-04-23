'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { LineChart } from '@/components/ui/charts';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function SentimentAnalysis() {
  // Mock data for sentiment analysis
  const sentimentTrend = [
    { date: '2025-03-15', positive: 65, neutral: 25, negative: 10 },
    { date: '2025-03-22', positive: 68, neutral: 22, negative: 10 },
    { date: '2025-03-29', positive: 72, neutral: 20, negative: 8 },
    { date: '2025-04-05', positive: 70, neutral: 22, negative: 8 },
    { date: '2025-04-12', positive: 75, neutral: 18, negative: 7 },
  ];

  const topPositiveTopics = [
    { topic: 'Product quality', count: 87, change: 12 },
    { topic: 'Customer service', count: 76, change: 8 },
    { topic: 'Ease of use', count: 72, change: 15 },
    { topic: 'Value for money', count: 68, change: 5 },
  ];

  const topNegativeTopics = [
    { topic: 'Pricing concerns', count: 42, change: -8 },
    { topic: 'Technical issues', count: 38, change: -12 },
    { topic: 'Onboarding process', count: 25, change: -5 },
    { topic: 'Feature requests', count: 22, change: 3 },
  ];

  return (
    <Card className="border-primary/20 shadow-md hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
      <CardHeader>
        <CardTitle>Customer Sentiment Analysis</CardTitle>
        <CardDescription>
          Analyze customer feedback and sentiment trends
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-accent/20 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Positive</span>
              <Badge className="bg-green-500/20 text-green-600 hover:bg-green-500/30">
                +7%
              </Badge>
            </div>
            <div className="text-2xl font-bold mb-2">75%</div>
            <Progress value={75} className="h-2" style={{ '--progress-color': '#22c55e' } as React.CSSProperties} />
          </div>
          
          <div className="bg-accent/20 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Neutral</span>
              <Badge className="bg-blue-500/20 text-blue-600 hover:bg-blue-500/30">
                -3%
              </Badge>
            </div>
            <div className="text-2xl font-bold mb-2">18%</div>
            <Progress value={18} className="h-2" style={{ '--progress-color': '#3b82f6' } as React.CSSProperties} />
          </div>
          
          <div className="bg-accent/20 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Negative</span>
              <Badge className="bg-red-500/20 text-red-600 hover:bg-red-500/30">
                -4%
              </Badge>
            </div>
            <div className="text-2xl font-bold mb-2">7%</div>
            <Progress value={7} className="h-2" style={{ '--progress-color': '#ef4444' } as React.CSSProperties} />
          </div>
        </div>

        <div className="mb-6">
          <h4 className="text-sm font-medium mb-3">Sentiment Trend</h4>
          <div className="h-[250px]">
            <LineChart
              data={sentimentTrend}
              categories={['positive', 'neutral', 'negative']}
              index="date"
              colors={['green', 'blue', 'red']}
              valueFormatter={(value) => `${value}%`}
              showLegend={true}
              showGridLines={true}
              showAnimation={true}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium mb-3">Top Positive Topics</h4>
            <div className="space-y-3">
              {topPositiveTopics.map((topic) => (
                <div key={topic.topic} className="bg-accent/20 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium">{topic.topic}</span>
                    <div className="flex items-center">
                      <span className="text-sm font-bold mr-2">{topic.count}</span>
                      <Badge className="bg-green-500/20 text-green-600 hover:bg-green-500/30">
                        +{topic.change}%
                      </Badge>
                    </div>
                  </div>
                  <Progress 
                    value={topic.count} 
                    className="h-1.5" 
                    style={{ '--progress-color': '#22c55e' } as React.CSSProperties} 
                  />
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-3">Top Negative Topics</h4>
            <div className="space-y-3">
              {topNegativeTopics.map((topic) => (
                <div key={topic.topic} className="bg-accent/20 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium">{topic.topic}</span>
                    <div className="flex items-center">
                      <span className="text-sm font-bold mr-2">{topic.count}</span>
                      <Badge 
                        className={cn(
                          topic.change < 0 
                            ? "bg-green-500/20 text-green-600 hover:bg-green-500/30" 
                            : "bg-red-500/20 text-red-600 hover:bg-red-500/30"
                        )}
                      >
                        {topic.change < 0 ? '' : '+'}
                        {topic.change}%
                      </Badge>
                    </div>
                  </div>
                  <Progress 
                    value={topic.count} 
                    className="h-1.5" 
                    style={{ '--progress-color': '#ef4444' } as React.CSSProperties} 
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
