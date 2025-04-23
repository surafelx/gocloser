import React from 'react';
import { render, screen } from '@testing-library/react';
import { MarkdownMessage } from '@/components/chat/markdown-message';

// Mock the PerformanceAnalysis component
jest.mock('@/components/chat/performance-analysis', () => ({
  PerformanceAnalysis: ({ performanceData, fileName, fileType }) => (
    <div data-testid="performance-analysis">
      Performance: {performanceData.overallScore}
      {fileName && <span>File: {fileName}</span>}
      {fileType && <span>Type: {fileType}</span>}
    </div>
  ),
}));

describe('MarkdownMessage Component', () => {
  test('renders markdown content correctly', () => {
    const content = '# Heading\n\nThis is a paragraph with **bold** text.';
    render(<MarkdownMessage content={content} />);
    
    expect(screen.getByText('Heading')).toBeInTheDocument();
    expect(screen.getByText('This is a paragraph with')).toBeInTheDocument();
    expect(screen.getByText('bold')).toBeInTheDocument();
  });

  test('renders performance analysis when performanceData is provided', () => {
    const content = 'Regular content';
    const performanceData = {
      overallScore: 85,
      metrics: [{ name: 'Clarity', score: 90 }],
      strengths: ['Good structure'],
      improvements: ['Add more examples'],
    };
    
    render(
      <MarkdownMessage 
        content={content} 
        performanceData={performanceData}
        attachmentName="test.pdf"
        attachmentType="text"
      />
    );
    
    expect(screen.getByTestId('performance-analysis')).toBeInTheDocument();
    expect(screen.getByText(/Performance: 85/)).toBeInTheDocument();
    expect(screen.getByText(/File: test.pdf/)).toBeInTheDocument();
    expect(screen.getByText(/Type: text/)).toBeInTheDocument();
  });

  test('does not render performance analysis when performanceData is not provided', () => {
    const content = 'Regular content';
    render(<MarkdownMessage content={content} />);
    
    expect(screen.queryByTestId('performance-analysis')).not.toBeInTheDocument();
  });

  test('renders code blocks correctly', () => {
    const content = '```javascript\nconst x = 1;\n```';
    render(<MarkdownMessage content={content} />);
    
    const codeElement = screen.getByText('const x = 1;');
    expect(codeElement).toBeInTheDocument();
    expect(codeElement.closest('pre')).toHaveClass('bg-gray-100');
  });

  test('renders links correctly', () => {
    const content = '[Visit Google](https://google.com)';
    render(<MarkdownMessage content={content} />);
    
    const link = screen.getByText('Visit Google');
    expect(link).toBeInTheDocument();
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', 'https://google.com');
  });

  test('renders lists correctly', () => {
    const content = '- Item 1\n- Item 2\n- Item 3';
    render(<MarkdownMessage content={content} />);
    
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.getByText('Item 3')).toBeInTheDocument();
    
    // Check that the list is rendered as a ul element
    const listItems = screen.getAllByText(/Item/);
    expect(listItems[0].closest('ul')).toBeInTheDocument();
  });
});
