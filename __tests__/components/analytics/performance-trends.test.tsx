import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PerformanceTrends } from '@/components/analytics/performance-trends';

// Mock the chart components
jest.mock('@/components/ui/charts', () => ({
  AreaChart: ({ data, categories }) => (
    <div data-testid="area-chart">
      <span>Data points: {data.length}</span>
      <span>Categories: {categories.join(', ')}</span>
    </div>
  ),
  BarChart: ({ data, categories }) => (
    <div data-testid="bar-chart">
      <span>Data points: {data.length}</span>
      <span>Categories: {categories.join(', ')}</span>
    </div>
  ),
  LineChart: ({ data, categories }) => (
    <div data-testid="line-chart">
      <span>Data points: {data.length}</span>
      <span>Categories: {categories.join(', ')}</span>
    </div>
  ),
}));

describe('PerformanceTrends Component', () => {
  test('renders correctly with default props', () => {
    render(<PerformanceTrends />);
    
    // Check that the component title is rendered
    expect(screen.getByText('Performance Trends')).toBeInTheDocument();
    
    // Check that the time filter is rendered
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    
    // Check that the tabs are rendered
    expect(screen.getByRole('tab', { name: 'Overall Score' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Skills Breakdown' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Improvement Areas' })).toBeInTheDocument();
    
    // Check that the area chart is rendered by default (Overall Score tab)
    expect(screen.getByTestId('area-chart')).toBeInTheDocument();
  });
  
  test('changes tab content when tabs are clicked', async () => {
    render(<PerformanceTrends />);
    
    // Initially, the area chart should be visible (Overall Score tab)
    expect(screen.getByTestId('area-chart')).toBeInTheDocument();
    
    // Click on the Skills Breakdown tab
    await userEvent.click(screen.getByRole('tab', { name: 'Skills Breakdown' }));
    
    // Now the bar chart should be visible
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    
    // Click on the Improvement Areas tab
    await userEvent.click(screen.getByRole('tab', { name: 'Improvement Areas' }));
    
    // Now the line chart should be visible
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });
  
  test('changes date range when time filter is changed', async () => {
    render(<PerformanceTrends />);
    
    // Open the select dropdown
    const select = screen.getByRole('combobox');
    await userEvent.click(select);
    
    // Select "Last 7 days" option
    await userEvent.click(screen.getByRole('option', { name: 'Last 7 days' }));
    
    // Check that the select value has changed
    expect(select).toHaveTextContent('Last 7 days');
  });
  
  test('displays custom date range picker when "Custom range" is selected', async () => {
    render(<PerformanceTrends />);
    
    // Open the select dropdown
    const select = screen.getByRole('combobox');
    await userEvent.click(select);
    
    // Select "Custom range" option
    await userEvent.click(screen.getByRole('option', { name: 'Custom range' }));
    
    // Check that the date range picker button is visible
    expect(screen.getByText('Pick a date range')).toBeInTheDocument();
  });
  
  test('displays correct metrics in the Overall Score tab', () => {
    render(<PerformanceTrends />);
    
    // Check that the starting and current scores are displayed
    expect(screen.getByText('Starting Score')).toBeInTheDocument();
    expect(screen.getByText('Current Score')).toBeInTheDocument();
    expect(screen.getByText('Improvement')).toBeInTheDocument();
  });
});
