'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BarChart } from '@/components/ui/charts';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function CompetitiveAnalysis() {
  // Mock data for competitive analysis
  const winRateByCompetitor = [
    { competitor: 'Competitor A', winRate: 68, lossRate: 32 },
    { competitor: 'Competitor B', winRate: 72, lossRate: 28 },
    { competitor: 'Competitor C', winRate: 58, lossRate: 42 },
    { competitor: 'Competitor D', winRate: 82, lossRate: 18 },
    { competitor: 'Competitor E', winRate: 75, lossRate: 25 },
  ];

  const competitiveStrengths = [
    { category: 'Product Features', us: 85, competitor: 78 },
    { category: 'Pricing', us: 72, competitor: 80 },
    { category: 'Customer Support', us: 90, competitor: 75 },
    { category: 'Ease of Use', us: 88, competitor: 82 },
    { category: 'Integration', us: 82, competitor: 70 },
  ];

  const topWinReasons = [
    { reason: 'Superior features', percentage: 32 },
    { reason: 'Better support', percentage: 28 },
    { reason: 'Ease of implementation', percentage: 18 },
    { reason: 'Integration capabilities', percentage: 12 },
    { reason: 'Other', percentage: 10 },
  ];

  const topLossReasons = [
    { reason: 'Price concerns', percentage: 42 },
    { reason: 'Missing features', percentage: 24 },
    { reason: 'Existing relationships', percentage: 18 },
    { reason: 'Implementation complexity', percentage: 10 },
    { reason: 'Other', percentage: 6 },
  ];

  return (
    <Card className="border-primary/20 shadow-md hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
      <CardHeader>
        <CardTitle>Competitive Analysis</CardTitle>
        <CardDescription>
          Analyze win/loss rates against competitors
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <h4 className="text-sm font-medium mb-3">Win Rate by Competitor</h4>
          <div className="space-y-3">
            {winRateByCompetitor.map((item) => (
              <div key={item.competitor} className="bg-accent/20 rounded-lg p-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium">{item.competitor}</span>
                  <div className="flex items-center">
                    <Badge className="bg-green-500/20 text-green-600 hover:bg-green-500/30 mr-2">
                      Win: {item.winRate}%
                    </Badge>
                    <Badge className="bg-red-500/20 text-red-600 hover:bg-red-500/30">
                      Loss: {item.lossRate}%
                    </Badge>
                  </div>
                </div>
                <div className="w-full bg-secondary/30 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-green-500 h-2.5 rounded-full" 
                    style={{ width: `${item.winRate}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <h4 className="text-sm font-medium mb-3">Competitive Strengths Comparison</h4>
          <div className="h-[250px]">
            <BarChart
              data={competitiveStrengths}
              categories={['us', 'competitor']}
              index="category"
              colors={['primary', 'orange']}
              valueFormatter={(value) => `${value}%`}
              showLegend={true}
              showGridLines={true}
              showAnimation={true}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium mb-3">Top Win Reasons</h4>
            <div className="space-y-3">
              {topWinReasons.map((item) => (
                <div key={item.reason} className="bg-accent/20 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium">{item.reason}</span>
                    <span className="text-sm font-bold">{item.percentage}%</span>
                  </div>
                  <Progress 
                    value={item.percentage} 
                    className="h-1.5" 
                    style={{ '--progress-color': '#22c55e' } as React.CSSProperties} 
                  />
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-3">Top Loss Reasons</h4>
            <div className="space-y-3">
              {topLossReasons.map((item) => (
                <div key={item.reason} className="bg-accent/20 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium">{item.reason}</span>
                    <span className="text-sm font-bold">{item.percentage}%</span>
                  </div>
                  <Progress 
                    value={item.percentage} 
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
