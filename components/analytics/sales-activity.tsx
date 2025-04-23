'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart } from '@/components/ui/charts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Phone, Mail, Calendar, MessageSquare, Users } from 'lucide-react';

export function SalesActivity() {
  // Mock data for sales activities
  const weeklyData = [
    { day: 'Mon', calls: 12, emails: 24, meetings: 2, messages: 18, demos: 1 },
    { day: 'Tue', calls: 18, emails: 28, meetings: 3, messages: 22, demos: 2 },
    { day: 'Wed', calls: 15, emails: 32, meetings: 4, messages: 16, demos: 1 },
    { day: 'Thu', calls: 20, emails: 26, meetings: 2, messages: 24, demos: 3 },
    { day: 'Fri', calls: 14, emails: 22, meetings: 3, messages: 20, demos: 2 },
  ];

  const monthlyData = [
    { week: 'Week 1', calls: 65, emails: 120, meetings: 12, messages: 85, demos: 8 },
    { week: 'Week 2', calls: 72, emails: 135, meetings: 15, messages: 92, demos: 10 },
    { week: 'Week 3', calls: 68, emails: 128, meetings: 14, messages: 88, demos: 9 },
    { week: 'Week 4', calls: 75, emails: 142, meetings: 16, messages: 95, demos: 11 },
  ];

  // Activity metrics
  const activityMetrics = [
    { 
      name: 'Calls', 
      icon: <Phone className="h-4 w-4" />, 
      count: 280, 
      change: 12, 
      color: '#6366f1',
      description: 'Total outbound calls'
    },
    { 
      name: 'Emails', 
      icon: <Mail className="h-4 w-4" />, 
      count: 525, 
      change: 8, 
      color: '#8b5cf6',
      description: 'Emails sent to prospects'
    },
    { 
      name: 'Meetings', 
      icon: <Calendar className="h-4 w-4" />, 
      count: 57, 
      change: 15, 
      color: '#d946ef',
      description: 'Scheduled meetings'
    },
    { 
      name: 'Messages', 
      icon: <MessageSquare className="h-4 w-4" />, 
      count: 360, 
      change: -5, 
      color: '#ec4899',
      description: 'Chat messages sent'
    },
    { 
      name: 'Demos', 
      icon: <Users className="h-4 w-4" />, 
      count: 38, 
      change: 22, 
      color: '#14b8a6',
      description: 'Product demonstrations'
    },
  ];

  return (
    <Card className="border-primary/20 shadow-md hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
      <CardHeader>
        <CardTitle>Sales Activity Breakdown</CardTitle>
        <CardDescription>
          Track your outreach and engagement activities
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          {activityMetrics.map((metric) => (
            <div key={metric.name} className="bg-accent/20 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <div className="p-2 rounded-full bg-primary/10 mr-2">
                  {metric.icon}
                </div>
                <span className="font-medium">{metric.name}</span>
              </div>
              <div className="flex items-baseline">
                <span className="text-2xl font-bold mr-2">{metric.count}</span>
                <span className={`text-xs ${metric.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {metric.change >= 0 ? '+' : ''}{metric.change}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{metric.description}</p>
            </div>
          ))}
        </div>

        <Tabs defaultValue="weekly">
          <TabsList className="mb-4">
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>
          
          <TabsContent value="weekly">
            <div className="h-[350px]">
              <BarChart
                data={weeklyData}
                categories={['calls', 'emails', 'meetings', 'messages', 'demos']}
                index="day"
                colors={['primary', 'indigo', 'violet', 'pink', 'teal']}
                valueFormatter={(value) => `${value}`}
                showLegend={true}
                showGridLines={true}
                showAnimation={true}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="monthly">
            <div className="h-[350px]">
              <BarChart
                data={monthlyData}
                categories={['calls', 'emails', 'meetings', 'messages', 'demos']}
                index="week"
                colors={['primary', 'indigo', 'violet', 'pink', 'teal']}
                valueFormatter={(value) => `${value}`}
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
