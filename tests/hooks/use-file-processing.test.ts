import { renderHook, act } from "@testing-library/react"
import { useFileProcessing } from "@/hooks/use-file-processing"

describe("useFileProcessing", () => {
  it("initializes with correct default state", () => {
    const { result } = renderHook(() => useFileProcessing())
    expect(result.current).toEqual({
      isProcessing: false,
      uploadProgress: 0,
      uploading: false,
      startProcessing: expect.any(Function),
      updateProgress: expect.any(Function),
      finishProcessing: expect.any(Function),
      reset: expect.any(Function),
    })
  })

  it("handles file processing lifecycle", () => {
    const { result } = renderHook(() => useFileProcessing())

    // Start processing
    act(() => {
      result.current.startProcessing()
    })
    expect(result.current).toEqual({
      isProcessing: true,
      uploadProgress: 0,
      uploading: true,
      startProcessing: expect.any(Function),
      updateProgress: expect.any(Function),
      finishProcessing: expect.any(Function),
      reset: expect.any(Function),
    })

    // Update progress
    act(() => {
      result.current.updateProgress(50)
    })
    expect(result.current.uploadProgress).toBe(50)

    // Finish processing
    act(() => {
      result.current.finishProcessing()
    })
    expect(result.current).toEqual({
      isProcessing: false,
      uploadProgress: 100,
      uploading: false,
      startProcessing: expect.any(Function),
      updateProgress: expect.any(Function),
      finishProcessing: expect.any(Function),
      reset: expect.any(Function),
    })

    // Reset state
    act(() => {
      result.current.reset()
    })
    expect(result.current).toEqual({
      isProcessing: false,
      uploadProgress: 0,
      uploading: false,
      startProcessing: expect.any(Function),
      updateProgress: expect.any(Function),
      finishProcessing: expect.any(Function),
      reset: expect.any(Function),
    })
  })
}) 