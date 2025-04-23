'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, ArrowDownRight, DollarSign, Users, Target, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  title: string;
  value: string;
  change: number;
  icon: React.ReactNode;
  className?: string;
}

function KpiCard({ title, value, change, icon, className }: KpiCardProps) {
  const isPositive = change >= 0;
  
  return (
    <Card className={cn("border-primary/20 shadow-md hover:shadow-xl hover:shadow-primary/5 transition-all duration-300", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
          <div className="bg-primary/10 p-2 rounded-full">
            {icon}
          </div>
        </div>
        <div className="text-3xl font-bold mb-3">{value}</div>
        <div className="flex items-center">
          <Badge 
            variant={isPositive ? "default" : "destructive"}
            className={cn(
              "font-medium",
              isPositive ? "bg-green-500/20 text-green-600 hover:bg-green-500/30" : "bg-red-500/20 text-red-600 hover:bg-red-500/30"
            )}
          >
            {isPositive ? <ArrowUpRight className="mr-1 h-3 w-3" /> : <ArrowDownRight className="mr-1 h-3 w-3" />}
            {Math.abs(change)}%
          </Badge>
          <span className="text-xs text-muted-foreground ml-2">vs last period</span>
        </div>
      </CardContent>
    </Card>
  );
}

export function KpiSummary() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <KpiCard
        title="Conversion Rate"
        value="24.8%"
        change={5.2}
        icon={<Target className="h-5 w-5 text-primary" />}
      />
      <KpiCard
        title="Average Deal Size"
        value="$8,942"
        change={3.1}
        icon={<DollarSign className="h-5 w-5 text-primary" />}
      />
      <KpiCard
        title="New Opportunities"
        value="142"
        change={-2.5}
        icon={<Users className="h-5 w-5 text-primary" />}
      />
      <KpiCard
        title="Win Rate"
        value="62.3%"
        change={7.8}
        icon={<BarChart3 className="h-5 w-5 text-primary" />}
      />
    </div>
  );
}
