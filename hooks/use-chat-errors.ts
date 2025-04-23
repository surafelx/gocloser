import { useState } from "react"

interface ErrorState {
  message: string
  retry?: () => void
}

export function useChatErrors() {
  const [error, setError] = useState<ErrorState | null>(null)

  const handleFileError = (error: unknown, retryAction: () => void) => {
    if (error instanceof Error) {
      if (error.message.includes("PDF")) {
        setError({
          message: "Failed to extract text from PDF. The file might be corrupted or password-protected.",
          retry: retryAction,
        })
      } else if (error.message.includes("media")) {
        setError({
          message: "Failed to process media file. The file might be corrupted.",
          retry: retryAction,
        })
      } else {
        setError({
          message: "An unexpected error occurred while processing your file.",
          retry: retryAction,
        })
      }
    } else {
      setError({
        message: "An unexpected error occurred. Please try again.",
        retry: retryAction,
      })
    }
  }

  const handleMessageError = (retryAction: () => void) => {
    setError({
      message: "Failed to send message. Please try again.",
      retry: retryAction,
    })
  }

  const clearError = () => {
    setError(null)
  }

  return {
    error,
    handleFileError,
    handleMessageError,
    clearError,
  }
} 