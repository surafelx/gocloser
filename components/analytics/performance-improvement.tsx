'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, BarChart } from '@/components/ui/charts';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function PerformanceImprovement() {
  // Mock data for skill improvement over time
  const skillImprovementData = [
    { date: '2025-03-01', objectionHandling: 65, discovery: 72, closing: 68, valueProposition: 70 },
    { date: '2025-03-15', objectionHandling: 68, discovery: 75, closing: 70, valueProposition: 73 },
    { date: '2025-04-01', objectionHandling: 72, discovery: 78, closing: 75, valueProposition: 76 },
    { date: '2025-04-15', objectionHandling: 75, discovery: 82, closing: 78, valueProposition: 80 },
    { date: '2025-05-01', objectionHandling: 80, discovery: 85, closing: 82, valueProposition: 84 },
  ];

  // Mock data for current skill levels
  const currentSkills = [
    { name: 'Objection Handling', score: 80, improvement: 15, color: '#6366f1' },
    { name: 'Discovery Questions', score: 85, improvement: 13, color: '#8b5cf6' },
    { name: 'Closing Techniques', score: 82, improvement: 14, color: '#d946ef' },
    { name: 'Value Proposition', score: 84, improvement: 14, color: '#ec4899' },
  ];

  // Mock data for most improved areas
  const mostImprovedAreas = [
    { name: 'Handling Price Objections', improvement: 22 },
    { name: 'Asking Open-Ended Questions', improvement: 18 },
    { name: 'Creating Urgency', improvement: 16 },
    { name: 'Articulating Value', improvement: 15 },
  ];

  return (
    <Card className="border-primary/20 shadow-md hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
      <CardHeader>
        <CardTitle>Performance Improvement</CardTitle>
        <CardDescription>
          Track your sales skills improvement over time
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h4 className="text-sm font-medium mb-3">Skill Improvement Over Time</h4>
            <div className="h-[300px]">
              <LineChart
                data={skillImprovementData}
                categories={['objectionHandling', 'discovery', 'closing', 'valueProposition']}
                index="date"
                colors={['primary', 'indigo', 'violet', 'pink']}
                valueFormatter={(value) => `${value}%`}
                showLegend={true}
                showGridLines={true}
                showAnimation={true}
              />
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-3">Current Skill Levels</h4>
            <div className="space-y-4">
              {currentSkills.map((skill) => (
                <div key={skill.name} className="bg-accent/20 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium">{skill.name}</span>
                    <div className="flex items-center">
                      <span className="text-sm font-bold mr-2">{skill.score}/100</span>
                      <Badge className="bg-green-500/20 text-green-600 hover:bg-green-500/30">
                        +{skill.improvement}%
                      </Badge>
                    </div>
                  </div>
                  <Progress 
                    value={skill.score} 
                    className="h-2" 
                    style={{ '--progress-color': skill.color } as React.CSSProperties} 
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium mb-3">Most Improved Areas</h4>
            <div className="h-[200px]">
              <BarChart
                data={mostImprovedAreas}
                categories={['improvement']}
                index="name"
                colors={['primary']}
                valueFormatter={(value) => `+${value}%`}
                showLegend={false}
                showGridLines={true}
                showAnimation={true}
              />
            </div>
          </div>
          
          <div className="bg-accent/20 rounded-lg p-4">
            <h4 className="text-sm font-medium mb-3">Practice Sessions</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">28</div>
                <div className="text-xs text-muted-foreground mt-1">Total Sessions</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">12.5</div>
                <div className="text-xs text-muted-foreground mt-1">Avg. Duration (min)</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-500">+15%</div>
                <div className="text-xs text-muted-foreground mt-1">Overall Improvement</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">4.2</div>
                <div className="text-xs text-muted-foreground mt-1">Sessions per Week</div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border/50">
              <div className="text-sm font-medium mb-2">Recent Focus Areas</div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="bg-primary/10">Objection Handling</Badge>
                <Badge variant="outline" className="bg-primary/10">Discovery Questions</Badge>
                <Badge variant="outline" className="bg-primary/10">Closing Techniques</Badge>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
