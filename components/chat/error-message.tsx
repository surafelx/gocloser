import { AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface ErrorMessageProps {
  message: string
  className?: string
  onRetry?: () => void
}

export function ErrorMessage({ message, className, onRetry }: ErrorMessageProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 p-3 rounded-lg bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400",
        className
      )}
    >
      <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 text-sm font-medium hover:underline"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  )
} 