'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronDown, ChevronUp, BarChart, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnimatedElement } from '@/components/animated-element';

interface PerformanceData {
  overallScore: number;
  metrics: {
    name: string;
    score: number;
  }[];
  strengths: string[];
  improvements: string[];
}

interface PerformanceAnalysisProps {
  performanceData?: PerformanceData;
  fileName?: string;
  fileType?: 'audio' | 'video' | 'text';
  expanded?: boolean;
  className?: string;
}

export function PerformanceAnalysis({
  performanceData,
  fileName,
  fileType,
  expanded = false,
  className,
}: PerformanceAnalysisProps) {
  const [isExpanded, setIsExpanded] = React.useState(expanded);

  // If performanceData is undefined, use default values
  const {
    overallScore = 70,
    metrics = [
      { name: 'Engagement', score: 70 },
      { name: 'Objection Handling', score: 70 },
      { name: 'Closing Techniques', score: 70 },
      { name: 'Product Knowledge', score: 70 },
    ],
    strengths = ['Strong product knowledge', 'Excellent rapport building'],
    improvements = ['Could improve handling of price objections', 'Need to ask more discovery questions']
  } = performanceData || {};

  // Get score color based on value
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-amber-500';
    return 'text-red-500';
  };

  // Get progress color based on value
  const getProgressColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <Card className={cn(
      'w-full border border-primary/20 bg-card/95 backdrop-blur-sm transition-all duration-300',
      isExpanded ? 'shadow-lg' : 'shadow-sm hover:shadow-md',
      className
    )}>
      <CardContent className="p-4">
        {/* Header with file info and expand/collapse button */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-400">
              Performance Analysis
            </h3>
            {fileName && (
              <p className="text-xs text-muted-foreground">
                {fileType === 'audio' ? 'Audio recording' :
                 fileType === 'video' ? 'Video recording' : 'Document'}: {fileName}
              </p>
            )}
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-full hover:bg-accent/50 transition-colors"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>

        {/* Overall score (always visible) */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart size={18} className="text-primary" />
            <span className="font-medium">Overall Score</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn("text-lg font-bold", getScoreColor(overallScore))}>
              {overallScore}/100
            </span>
          </div>
        </div>

        {/* Expandable content */}
        {isExpanded && (
          <AnimatedElement type="fade-in" duration={300}>
            <Tabs defaultValue="metrics" className="mt-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="metrics">Metrics</TabsTrigger>
                <TabsTrigger value="strengths">Strengths</TabsTrigger>
                <TabsTrigger value="improvements">To Improve</TabsTrigger>
              </TabsList>

              {/* Metrics Tab */}
              <TabsContent value="metrics" className="space-y-3 mt-3">
                {metrics.map((metric, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{metric.name}</span>
                      <span className={cn("text-sm font-semibold", getScoreColor(metric.score))}>
                        {metric.score}/100
                      </span>
                    </div>
                    <Progress
                      value={metric.score}
                      className="h-1.5 bg-secondary/50"
                      indicatorClassName={getProgressColor(metric.score)}
                    />
                  </div>
                ))}
              </TabsContent>

              {/* Strengths Tab */}
              <TabsContent value="strengths" className="mt-3">
                <ul className="space-y-2">
                  {strengths.map((strength, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{strength}</span>
                    </li>
                  ))}
                </ul>
              </TabsContent>

              {/* Improvements Tab */}
              <TabsContent value="improvements" className="mt-3">
                <ul className="space-y-2">
                  {improvements.map((improvement, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <AlertCircle size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{improvement}</span>
                    </li>
                  ))}
                </ul>
              </TabsContent>
            </Tabs>
          </AnimatedElement>
        )}
      </CardContent>
    </Card>
  );
}
