import { useState, useCallback } from "react"

interface FileProcessingState {
  isProcessing: boolean
  uploadProgress: number
  uploading: boolean
  error: string | null
}

export function useFileProcessing() {
  const [state, setState] = useState<FileProcessingState>({
    isProcessing: false,
    uploadProgress: 0,
    uploading: false,
    error: null
  })

  const startProcessing = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isProcessing: true,
      uploadProgress: 0,
      uploading: true,
      error: null
    }))

    // Simulate slower upload progress
    const simulateProgress = () => {
      setState(prev => {
        // Only update if still uploading
        if (!prev.uploading) return prev;

        // Calculate new progress
        const newProgress = Math.min(prev.uploadProgress + (Math.random() * 5), 95);

        // Schedule next update if not at max
        if (newProgress < 95) {
          // Slower animation - longer delay between updates
          setTimeout(simulateProgress, 300 + Math.random() * 500);
        }

        return {
          ...prev,
          uploadProgress: newProgress
        };
      });
    };

    // Start the simulation
    setTimeout(simulateProgress, 500);
  }, [])

  const updateProgress = useCallback((progress: number) => {
    setState((prev) => ({
      ...prev,
      uploadProgress: Math.min(progress, 99), // Cap at 99% until fully complete
    }))
  }, [])

  const finishProcessing = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isProcessing: false,
      uploadProgress: 100,
      uploading: false,
    }))
  }, [])

  const setError = useCallback((errorMessage: string) => {
    setState((prev) => ({
      ...prev,
      error: errorMessage,
      isProcessing: false,
      uploading: false,
    }))
  }, [])

  const reset = useCallback(() => {
    setState({
      isProcessing: false,
      uploadProgress: 0,
      uploading: false,
      error: null
    })
  }, [])

  return {
    ...state,
    startProcessing,
    updateProgress,
    finishProcessing,
    setError,
    reset,
  }
}