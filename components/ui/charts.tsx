'use client';

import React from 'react';
import {
  AreaChart as TremorAreaChart,
  BarChart as TremorBarChart,
  LineChart as TremorLineChart,
  Card,
  Title,
  Text
} from '@tremor/react';
import { cn } from '@/lib/utils';

interface ChartProps {
  data: any[];
  categories: string[];
  index: string;
  colors?: string[];
  valueFormatter?: (value: number) => string;
  showLegend?: boolean;
  showGridLines?: boolean;
  startEndOnly?: boolean;
  showAnimation?: boolean;
  className?: string;
  title?: string;
  subtitle?: string;
}

// Helper function to map color names to Tremor color classes
const mapColors = (colors: string[] = ['blue']) => {
  const colorMap: Record<string, string> = {
    primary: 'blue',
    secondary: 'slate',
    green: 'emerald',
    red: 'rose',
    yellow: 'amber',
    blue: 'blue',
    purple: 'blue',
    orange: 'orange',
    pink: 'pink',
    gray: 'gray',
  };

  return colors.map(color => colorMap[color] || color);
};

export function AreaChart({
  data,
  categories,
  index,
  colors = ['primary'],
  valueFormatter = (value) => `${value}`,
  showLegend = true,
  showGridLines = true,
  startEndOnly = false,
  showAnimation = true,
  className,
  title,
  subtitle,
}: ChartProps) {
  const mappedColors = mapColors(colors);

  return (
    <Card className={cn('p-0 border-0 shadow-none', className)}>
      {title && <Title>{title}</Title>}
      {subtitle && <Text>{subtitle}</Text>}
      <TremorAreaChart
        data={data}
        categories={categories}
        index={index}
        colors={mappedColors as any}
        valueFormatter={valueFormatter}
        showLegend={showLegend}
        showGridLines={showGridLines}
        startEndOnly={startEndOnly}
        showAnimation={showAnimation}
        className="h-full"
      />
    </Card>
  );
}

export function BarChart({
  data,
  categories,
  index,
  colors = ['primary'],
  valueFormatter = (value) => `${value}`,
  showLegend = true,
  showGridLines = true,
  showAnimation = true,
  className,
  title,
  subtitle,
}: ChartProps) {
  const mappedColors = mapColors(colors);

  return (
    <Card className={cn('p-0 border-0 shadow-none', className)}>
      {title && <Title>{title}</Title>}
      {subtitle && <Text>{subtitle}</Text>}
      <TremorBarChart
        data={data}
        categories={categories}
        index={index}
        colors={mappedColors as any}
        valueFormatter={valueFormatter}
        showLegend={showLegend}
        showGridLines={showGridLines}
        showAnimation={showAnimation}
        className="h-full"
      />
    </Card>
  );
}

export function LineChart({
  data,
  categories,
  index,
  colors = ['primary'],
  valueFormatter = (value) => `${value}`,
  showLegend = true,
  showGridLines = true,
  showAnimation = true,
  className,
  title,
  subtitle,
}: ChartProps) {
  const mappedColors = mapColors(colors);

  return (
    <Card className={cn('p-0 border-0 shadow-none', className)}>
      {title && <Title>{title}</Title>}
      {subtitle && <Text>{subtitle}</Text>}
      <TremorLineChart
        data={data}
        categories={categories}
        index={index}
        colors={mappedColors as any}
        valueFormatter={valueFormatter}
        showLegend={showLegend}
        showGridLines={showGridLines}
        showAnimation={showAnimation}
        className="h-full"
      />
    </Card>
  );
}
