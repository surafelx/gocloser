'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface FunnelStageProps {
  stage: string;
  count: number;
  total: number;
  color: string;
  previousCount?: number;
}

function FunnelStage({ stage, count, total, color, previousCount }: FunnelStageProps) {
  const percentage = Math.round((count / total) * 100);
  const change = previousCount ? Math.round(((count - previousCount) / previousCount) * 100) : 0;
  const isPositive = change >= 0;
  
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center">
          <div className={cn("w-3 h-3 rounded-full mr-2")} style={{ backgroundColor: color }}></div>
          <span className="font-medium">{stage}</span>
        </div>
        <div className="flex items-center">
          <span className="font-bold">{count}</span>
          <span className="text-muted-foreground ml-1 text-sm">({percentage}%)</span>
          {previousCount && (
            <span className={cn(
              "ml-2 text-xs",
              isPositive ? "text-green-500" : "text-red-500"
            )}>
              {isPositive ? "+" : ""}{change}%
            </span>
          )}
        </div>
      </div>
      <Progress 
        value={percentage} 
        className="h-2" 
        style={{ '--progress-color': color } as React.CSSProperties} 
      />
    </div>
  );
}

export function ConversionFunnel() {
  // Mock data for the sales funnel
  const funnelData = {
    total: 1250,
    stages: [
      { stage: "Leads", count: 1250, previousCount: 1180, color: "#6366f1" },
      { stage: "Qualified", count: 820, previousCount: 750, color: "#8b5cf6" },
      { stage: "Proposals", count: 410, previousCount: 380, color: "#d946ef" },
      { stage: "Negotiations", count: 215, previousCount: 190, color: "#ec4899" },
      { stage: "Closed Won", count: 142, previousCount: 125, color: "#14b8a6" },
    ]
  };

  const conversionRate = Math.round((funnelData.stages[4].count / funnelData.total) * 100);
  const previousConversionRate = Math.round((funnelData.stages[4].previousCount! / funnelData.stages[0].previousCount!) * 100);
  const conversionChange = conversionRate - previousConversionRate;
  
  return (
    <Card className="border-primary/20 shadow-md hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
      <CardHeader>
        <CardTitle>Sales Conversion Funnel</CardTitle>
        <CardDescription>
          Track your sales pipeline conversion rates
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Overall Conversion Rate</span>
            <div className="flex items-center">
              <span className="text-2xl font-bold">{conversionRate}%</span>
              <span className={cn(
                "ml-2 text-sm",
                conversionChange >= 0 ? "text-green-500" : "text-red-500"
              )}>
                {conversionChange >= 0 ? "+" : ""}{conversionChange}%
              </span>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            {funnelData.stages[4].count} closed deals from {funnelData.total} leads
          </div>
        </div>
        
        <div className="space-y-4">
          {funnelData.stages.map((stage, index) => (
            <FunnelStage
              key={stage.stage}
              stage={stage.stage}
              count={stage.count}
              total={funnelData.total}
              color={stage.color}
              previousCount={stage.previousCount}
            />
          ))}
        </div>
        
        <div className="mt-6 pt-4 border-t text-sm text-muted-foreground">
          <div className="flex justify-between">
            <span>Average sales cycle:</span>
            <span className="font-medium">32 days</span>
          </div>
          <div className="flex justify-between mt-1">
            <span>Average deal size:</span>
            <span className="font-medium">$8,942</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
