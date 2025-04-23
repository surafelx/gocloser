'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, ChevronDown, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AreaChart, BarChart, LineChart } from '@/components/ui/charts';

interface PerformanceTrendsProps {
  className?: string;
}

export function PerformanceTrends({ className }: PerformanceTrendsProps) {
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    to: new Date(),
  });
  
  const [timeFilter, setTimeFilter] = useState('30d');
  
  // Mock data for performance metrics
  const overallScoreData = [
    { date: '2025-03-15', value: 72 },
    { date: '2025-03-16', value: 75 },
    { date: '2025-03-17', value: 74 },
    { date: '2025-03-18', value: 78 },
    { date: '2025-03-19', value: 76 },
    { date: '2025-03-20', value: 80 },
    { date: '2025-03-21', value: 82 },
    { date: '2025-03-22', value: 81 },
    { date: '2025-03-23', value: 83 },
    { date: '2025-03-24', value: 85 },
    { date: '2025-03-25', value: 84 },
    { date: '2025-03-26', value: 86 },
    { date: '2025-03-27', value: 88 },
    { date: '2025-03-28', value: 87 },
    { date: '2025-03-29', value: 89 },
    { date: '2025-03-30', value: 90 },
    { date: '2025-03-31', value: 91 },
    { date: '2025-04-01', value: 89 },
    { date: '2025-04-02', value: 92 },
    { date: '2025-04-03', value: 93 },
    { date: '2025-04-04', value: 92 },
    { date: '2025-04-05', value: 94 },
    { date: '2025-04-06', value: 95 },
    { date: '2025-04-07', value: 94 },
    { date: '2025-04-08', value: 96 },
    { date: '2025-04-09', value: 97 },
    { date: '2025-04-10', value: 96 },
    { date: '2025-04-11', value: 98 },
    { date: '2025-04-12', value: 97 },
    { date: '2025-04-13', value: 99 },
  ];
  
  const skillsData = [
    { name: 'Discovery', value: 85 },
    { name: 'Objection Handling', value: 78 },
    { name: 'Closing', value: 92 },
    { name: 'Rapport Building', value: 88 },
    { name: 'Product Knowledge', value: 95 },
  ];
  
  const improvementData = [
    { date: '2025-03-15', discovery: 70, objections: 65, closing: 80 },
    { date: '2025-03-22', discovery: 75, objections: 68, closing: 83 },
    { date: '2025-03-29', discovery: 78, objections: 72, closing: 85 },
    { date: '2025-04-05', discovery: 82, objections: 75, closing: 88 },
    { date: '2025-04-12', discovery: 85, objections: 78, closing: 92 },
  ];
  
  // Handle time filter change
  const handleTimeFilterChange = (value: string) => {
    setTimeFilter(value);
    
    const now = new Date();
    let fromDate;
    
    switch (value) {
      case '7d':
        fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        fromDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'ytd':
        fromDate = new Date(now.getFullYear(), 0, 1); // January 1st of current year
        break;
      case 'all':
        fromDate = new Date(2023, 0, 1); // January 1st, 2023
        break;
      default:
        fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    
    setDateRange({
      from: fromDate,
      to: now,
    });
  };
  
  return (
    <Card className={cn('', className)}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Performance Trends</CardTitle>
          <CardDescription>Track your improvement over time</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeFilter} onValueChange={handleTimeFilterChange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="ytd">Year to date</SelectItem>
              <SelectItem value="all">All time</SelectItem>
              <SelectItem value="custom">Custom range</SelectItem>
            </SelectContent>
          </Select>
          
          {timeFilter === 'custom' && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal w-[240px]">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, 'LLL dd, y')} - {format(dateRange.to, 'LLL dd, y')}
                      </>
                    ) : (
                      format(dateRange.from, 'LLL dd, y')
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                  <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={(range) => setDateRange(range || { from: undefined, to: undefined })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          )}
          
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overall">
          <TabsList className="mb-4">
            <TabsTrigger value="overall">Overall Score</TabsTrigger>
            <TabsTrigger value="skills">Skills Breakdown</TabsTrigger>
            <TabsTrigger value="improvement">Improvement Areas</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overall" className="space-y-4">
            <div className="h-[350px]">
              <AreaChart
                data={overallScoreData}
                categories={['value']}
                index="date"
                colors={['primary']}
                valueFormatter={(value) => `${value}%`}
                showLegend={false}
                showGridLines={true}
                startEndOnly={false}
                showAnimation={true}
                className="h-full"
              />
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <div>
                <p className="font-medium">Starting Score</p>
                <p className="text-2xl font-bold text-foreground">{overallScoreData[0].value}%</p>
              </div>
              <div>
                <p className="font-medium">Current Score</p>
                <p className="text-2xl font-bold text-foreground">{overallScoreData[overallScoreData.length - 1].value}%</p>
              </div>
              <div>
                <p className="font-medium">Improvement</p>
                <p className="text-2xl font-bold text-green-500">
                  +{overallScoreData[overallScoreData.length - 1].value - overallScoreData[0].value}%
                </p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="skills">
            <div className="h-[350px]">
              <BarChart
                data={skillsData}
                categories={['value']}
                index="name"
                colors={['primary']}
                valueFormatter={(value) => `${value}%`}
                showLegend={false}
                showGridLines={true}
                showAnimation={true}
                className="h-full"
              />
            </div>
          </TabsContent>
          
          <TabsContent value="improvement">
            <div className="h-[350px]">
              <LineChart
                data={improvementData}
                categories={['discovery', 'objections', 'closing']}
                index="date"
                colors={['primary', 'orange', 'green']}
                valueFormatter={(value) => `${value}%`}
                showLegend={true}
                showGridLines={true}
                showAnimation={true}
                className="h-full"
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
