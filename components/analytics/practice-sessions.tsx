'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, LineChart } from '@/components/ui/charts';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Calendar, Clock, Target, TrendingUp } from 'lucide-react';

export function PracticeSessions() {
  // Mock data for practice sessions
  const practiceSessionsData = {
    total: 28,
    thisWeek: 4,
    avgDuration: 12.5, // minutes
    improvement: 15,
    completionRate: 92,
  };

  // Mock data for practice sessions by scenario
  const scenarioData = [
    { name: 'Cold Calling', count: 8, improvement: 18 },
    { name: 'Discovery Calls', count: 6, improvement: 15 },
    { name: 'Objection Handling', count: 10, improvement: 22 },
    { name: 'Closing Techniques', count: 4, improvement: 12 },
  ];

  // Mock data for practice sessions over time
  const sessionsOverTime = [
    { week: 'Week 1', count: 5, duration: 10, improvement: 5 },
    { week: 'Week 2', count: 6, duration: 11, improvement: 8 },
    { week: 'Week 3', count: 5, duration: 12, improvement: 12 },
    { week: 'Week 4', count: 7, duration: 13, improvement: 15 },
    { week: 'Week 5', count: 5, duration: 14, improvement: 18 },
  ];

  // Mock data for recent practice sessions
  const recentSessions = [
    {
      id: 1,
      scenario: 'Objection Handling - Price',
      date: '2 days ago',
      duration: 14, // minutes
      score: 85,
      improvement: 12,
    },
    {
      id: 2,
      scenario: 'Discovery Call - Enterprise',
      date: '4 days ago',
      duration: 18, // minutes
      score: 78,
      improvement: 8,
    },
    {
      id: 3,
      scenario: 'Closing Techniques - Trial Close',
      date: '1 week ago',
      duration: 10, // minutes
      score: 82,
      improvement: 15,
    },
  ];

  return (
    <Card className="border-primary/20 shadow-md hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
      <CardHeader>
        <CardTitle>Practice Sessions</CardTitle>
        <CardDescription>
          Track your AI-assisted practice sessions and improvement
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-accent/20 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <div className="p-2 rounded-full bg-primary/10 mr-2">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <span className="font-medium">Total Sessions</span>
            </div>
            <div className="text-2xl font-bold">{practiceSessionsData.total}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {practiceSessionsData.thisWeek} this week
            </div>
          </div>
          
          <div className="bg-accent/20 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <div className="p-2 rounded-full bg-primary/10 mr-2">
                <Clock className="h-4 w-4 text-primary" />
              </div>
              <span className="font-medium">Avg. Duration</span>
            </div>
            <div className="text-2xl font-bold">{practiceSessionsData.avgDuration} min</div>
            <div className="text-xs text-muted-foreground mt-1">
              Per practice session
            </div>
          </div>
          
          <div className="bg-accent/20 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <div className="p-2 rounded-full bg-primary/10 mr-2">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <span className="font-medium">Improvement</span>
            </div>
            <div className="text-2xl font-bold text-green-500">+{practiceSessionsData.improvement}%</div>
            <div className="text-xs text-muted-foreground mt-1">
              Overall skill improvement
            </div>
          </div>
          
          <div className="bg-accent/20 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <div className="p-2 rounded-full bg-primary/10 mr-2">
                <Target className="h-4 w-4 text-primary" />
              </div>
              <span className="font-medium">Completion Rate</span>
            </div>
            <div className="text-2xl font-bold">{practiceSessionsData.completionRate}%</div>
            <div className="text-xs text-muted-foreground mt-1">
              Sessions completed fully
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h4 className="text-sm font-medium mb-3">Sessions by Scenario</h4>
            <div className="h-[250px]">
              <BarChart
                data={scenarioData}
                categories={['count']}
                index="name"
                colors={['primary']}
                valueFormatter={(value) => `${value} sessions`}
                showLegend={false}
                showGridLines={true}
                showAnimation={true}
              />
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-3">Progress Over Time</h4>
            <div className="h-[250px]">
              <LineChart
                data={sessionsOverTime}
                categories={['count', 'duration', 'improvement']}
                index="week"
                colors={['primary', 'indigo', 'green']}
                valueFormatter={(value) => `${value}`}
                showLegend={true}
                showGridLines={true}
                showAnimation={true}
              />
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium mb-3">Recent Practice Sessions</h4>
          <div className="space-y-3">
            {recentSessions.map((session) => (
              <div key={session.id} className="bg-accent/20 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium">{session.scenario}</h4>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3 mr-1" />
                      <span>{session.date}</span>
                      <Clock className="h-3 w-3 ml-3 mr-1" />
                      <span>{session.duration} min</span>
                    </div>
                  </div>
                  <Badge className="bg-green-500/20 text-green-600 hover:bg-green-500/30">
                    +{session.improvement}%
                  </Badge>
                </div>
                
                <div className="mt-3 mb-1">
                  <div className="flex justify-between items-center mb-1 text-sm">
                    <span>Performance Score</span>
                    <span className="font-medium">{session.score}/100</span>
                  </div>
                  <Progress 
                    value={session.score} 
                    className="h-2" 
                    style={{ '--progress-color': '#6366f1' } as React.CSSProperties} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
