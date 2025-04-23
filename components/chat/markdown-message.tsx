import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { cn } from "@/lib/utils"
import { PerformanceAnalysis } from "./performance-analysis"

interface MarkdownMessageProps {
  content: string
  className?: string
  performanceData?: {
    overallScore: number
    metrics: {
      name: string
      score: number
    }[]
    strengths: string[]
    improvements: string[]
  }
  attachmentName?: string
  attachmentType?: 'audio' | 'video' | 'text'
}

export function MarkdownMessage({ content, className, performanceData, attachmentName, attachmentType }: MarkdownMessageProps) {
  return (
    <div className={cn("prose prose-sm dark:prose-invert max-w-none", className)}>
      {performanceData && (
        <div className="mb-4">
          <PerformanceAnalysis
            performanceData={performanceData}
            fileName={attachmentName}
            fileType={attachmentType}
          />
        </div>
      )}
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ className, ...props }) => (
            <h1
              className={cn(
                "text-xl font-bold mt-6 mb-4 text-gray-900 dark:text-gray-50",
                className
              )}
              {...props}
            />
          ),
          h2: ({ className, ...props }) => (
            <h2
              className={cn(
                "text-lg font-semibold mt-4 mb-3 text-gray-800 dark:text-gray-100",
                className
              )}
              {...props}
            />
          ),
          h3: ({ className, ...props }) => (
            <h3
              className={cn(
                "text-base font-semibold mt-3 mb-2 text-gray-800 dark:text-gray-100",
                className
              )}
              {...props}
            />
          ),
          p: ({ className, ...props }) => (
            <p
              className={cn(
                "text-sm leading-7 mb-3 text-gray-800 dark:text-gray-200",
                className
              )}
              {...props}
            />
          ),
          ul: ({ className, ...props }) => (
            <ul
              className={cn("list-disc list-inside space-y-1 mb-3 text-gray-800 dark:text-gray-200", className)}
              {...props}
            />
          ),
          ol: ({ className, ...props }) => (
            <ol
              className={cn("list-decimal list-inside space-y-1 mb-3 text-gray-800 dark:text-gray-200", className)}
              {...props}
            />
          ),
          li: ({ className, ...props }) => (
            <li
              className={cn(
                "text-sm text-gray-800 dark:text-gray-200",
                className
              )}
              {...props}
            />
          ),
          code: ({ className, ...props }) => (
            <code
              className={cn(
                "bg-gray-100 dark:bg-gray-800 rounded px-1 py-0.5 text-sm font-mono",
                className
              )}
              {...props}
            />
          ),
          pre: ({ className, ...props }) => (
            <pre
              className={cn(
                "bg-gray-100 dark:bg-gray-800 rounded p-3 overflow-x-auto",
                className
              )}
              {...props}
            />
          ),
          blockquote: ({ className, ...props }) => (
            <blockquote
              className={cn(
                "border-l-4 border-gray-200 dark:border-gray-700 pl-4 italic",
                className
              )}
              {...props}
            />
          ),
          a: ({ className, ...props }) => (
            <a
              className={cn(
                "text-blue-600 dark:text-blue-400 hover:underline",
                className
              )}
              {...props}
            />
          ),
          strong: ({ className, ...props }) => (
            <strong
              className={cn("font-semibold text-gray-900 dark:text-white", className)}
              {...props}
            />
          ),
          em: ({ className, ...props }) => (
            <em className={cn("italic text-gray-800 dark:text-gray-200", className)} {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}