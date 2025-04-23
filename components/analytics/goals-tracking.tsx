'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { LineChart } from '@/components/ui/charts';
import { cn } from '@/lib/utils';
import { CheckCircle2, AlertCircle, Clock } from 'lucide-react';

interface GoalProgressProps {
  name: string;
  target: number;
  current: number;
  unit: string;
  timeLeft: string;
  status: 'on-track' | 'at-risk' | 'completed';
}

function GoalProgress({ name, target, current, unit, timeLeft, status }: GoalProgressProps) {
  const percentage = Math.min(Math.round((current / target) * 100), 100);
  
  const statusColors = {
    'on-track': { bg: 'bg-green-500/20', text: 'text-green-600', icon: <CheckCircle2 className="h-4 w-4 text-green-600" /> },
    'at-risk': { bg: 'bg-amber-500/20', text: 'text-amber-600', icon: <AlertCircle className="h-4 w-4 text-amber-600" /> },
    'completed': { bg: 'bg-blue-500/20', text: 'text-blue-600', icon: <CheckCircle2 className="h-4 w-4 text-blue-600" /> },
  };
  
  const statusColor = statusColors[status];
  
  return (
    <div className="bg-accent/20 rounded-lg p-4">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="font-medium">{name}</h4>
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="h-3 w-3 mr-1" />
            <span>{timeLeft}</span>
          </div>
        </div>
        <Badge className={cn(statusColor.bg, statusColor.text, "hover:bg-opacity-30")}>
          <span className="flex items-center">
            {statusColor.icon}
            <span className="ml-1">{status === 'on-track' ? 'On Track' : status === 'at-risk' ? 'At Risk' : 'Completed'}</span>
          </span>
        </Badge>
      </div>
      
      <div className="mt-4 mb-2">
        <div className="flex justify-between items-center mb-1 text-sm">
          <span>Progress</span>
          <span className="font-medium">{percentage}%</span>
        </div>
        <Progress 
          value={percentage} 
          className="h-2" 
          style={{ 
            '--progress-color': status === 'on-track' ? '#22c55e' : 
                               status === 'at-risk' ? '#f59e0b' : '#3b82f6' 
          } as React.CSSProperties} 
        />
      </div>
      
      <div className="flex justify-between items-center text-sm mt-3">
        <span>Current: <span className="font-medium">{current.toLocaleString()} {unit}</span></span>
        <span>Target: <span className="font-medium">{target.toLocaleString()} {unit}</span></span>
      </div>
    </div>
  );
}

export function GoalsTracking() {
  // Mock data for goals tracking
  const goals = [
    { 
      name: 'Quarterly Revenue', 
      target: 500000, 
      current: 425000, 
      unit: 'USD', 
      timeLeft: '2 weeks left', 
      status: 'on-track' as const 
    },
    { 
      name: 'New Customers', 
      target: 50, 
      current: 38, 
      unit: 'customers', 
      timeLeft: '2 weeks left', 
      status: 'at-risk' as const 
    },
    { 
      name: 'Sales Calls', 
      target: 300, 
      current: 312, 
      unit: 'calls', 
      timeLeft: 'Completed', 
      status: 'completed' as const 
    },
    { 
      name: 'Deal Closure Rate', 
      target: 25, 
      current: 22, 
      unit: '%', 
      timeLeft: '2 weeks left', 
      status: 'on-track' as const 
    },
  ];

  // Mock data for goal progress over time
  const progressData = [
    { week: 'Week 1', revenue: 105000, customers: 8, calls: 78, closureRate: 18 },
    { week: 'Week 2', revenue: 215000, customers: 16, calls: 156, closureRate: 19 },
    { week: 'Week 3', revenue: 320000, customers: 26, calls: 234, closureRate: 20 },
    { week: 'Week 4', revenue: 425000, customers: 38, calls: 312, closureRate: 22 },
  ];

  return (
    <Card className="border-primary/20 shadow-md hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
      <CardHeader>
        <CardTitle>Goals & Targets</CardTitle>
        <CardDescription>
          Track progress towards your quarterly goals
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {goals.map((goal) => (
            <GoalProgress
              key={goal.name}
              name={goal.name}
              target={goal.target}
              current={goal.current}
              unit={goal.unit}
              timeLeft={goal.timeLeft}
              status={goal.status}
            />
          ))}
        </div>

        <div className="mt-6">
          <h4 className="text-sm font-medium mb-3">Progress Trend</h4>
          <div className="h-[250px]">
            <LineChart
              data={progressData}
              categories={['revenue', 'customers', 'calls', 'closureRate']}
              index="week"
              colors={['primary', 'green', 'blue', 'amber']}
              valueFormatter={(value) => `${value}`}
              showLegend={true}
              showGridLines={true}
              showAnimation={true}
            />
          </div>
          <div className="text-xs text-muted-foreground mt-2 text-center">
            Note: Values are normalized for comparison (Revenue ÷ 10,000, Calls ÷ 10)
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
