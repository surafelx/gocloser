'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart } from '@/components/ui/charts';
import { Badge } from '@/components/ui/badge';
import { FileText, BookOpen, FileQuestion, Users, MessageSquare } from 'lucide-react';

export function TrainingMaterialsUsage() {
  // Mock data for training materials usage
  const trainingCategories = [
    { 
      name: 'Scripts', 
      count: 42, 
      icon: <FileText className="h-4 w-4" />, 
      color: '#6366f1',
      description: 'Sales scripts and templates'
    },
    { 
      name: 'Closing', 
      count: 35, 
      icon: <Users className="h-4 w-4" />, 
      color: '#8b5cf6',
      description: 'Closing techniques'
    },
    { 
      name: 'Interview', 
      count: 28, 
      icon: <MessageSquare className="h-4 w-4" />, 
      color: '#d946ef',
      description: 'Interview preparation'
    },
    { 
      name: 'Intelligence', 
      count: 18, 
      icon: <BookOpen className="h-4 w-4" />, 
      color: '#ec4899',
      description: 'Gathering intelligence'
    },
    { 
      name: 'General', 
      count: 22, 
      icon: <FileQuestion className="h-4 w-4" />, 
      color: '#14b8a6',
      description: 'Other training materials'
    },
  ];

  // Mock data for training materials usage over time
  const usageData = [
    { date: '2025-03-15', scripts: 8, closing: 6, interview: 5, intelligence: 3, general: 4 },
    { date: '2025-03-22', scripts: 10, closing: 7, interview: 6, intelligence: 4, general: 5 },
    { date: '2025-03-29', scripts: 9, closing: 8, interview: 5, intelligence: 3, general: 4 },
    { date: '2025-04-05', scripts: 12, closing: 9, interview: 7, intelligence: 5, general: 6 },
    { date: '2025-04-12', scripts: 11, closing: 8, interview: 6, intelligence: 4, general: 5 },
  ];

  return (
    <Card className="border-primary/20 shadow-md hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
      <CardHeader>
        <CardTitle>Training Materials Usage</CardTitle>
        <CardDescription>
          How often different training materials are referenced in AI responses
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          {trainingCategories.map((category) => (
            <div key={category.name} className="bg-accent/20 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <div className="p-2 rounded-full bg-primary/10 mr-2">
                  {category.icon}
                </div>
                <span className="font-medium">{category.name}</span>
              </div>
              <div className="flex items-baseline">
                <span className="text-2xl font-bold mr-2">{category.count}</span>
                <Badge className="bg-primary/20 text-primary hover:bg-primary/30">
                  {Math.round((category.count / 145) * 100)}%
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{category.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <h4 className="text-sm font-medium mb-3">Usage Trend</h4>
          <div className="h-[350px]">
            <BarChart
              data={usageData}
              categories={['scripts', 'closing', 'interview', 'intelligence', 'general']}
              index="date"
              colors={['primary', 'indigo', 'violet', 'pink', 'teal']}
              valueFormatter={(value) => `${value}`}
              showLegend={true}
              showGridLines={true}
              showAnimation={true}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
