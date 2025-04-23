import { renderHook, act } from "@testing-library/react"
import { useChatErrors } from "@/hooks/use-chat-errors"

describe("useChatErrors", () => {
  it("initializes with no error", () => {
    const { result } = renderHook(() => useChatErrors())
    expect(result.current.error).toBeNull()
  })

  it("handles file errors correctly", () => {
    const { result } = renderHook(() => useChatErrors())
    const retryAction = jest.fn()

    // Test PDF error
    act(() => {
      result.current.handleFileError(new Error("PDF error"), retryAction)
    })
    expect(result.current.error).toEqual({
      message: "Failed to extract text from PDF. The file might be corrupted or password-protected.",
      retry: retryAction,
    })

    // Test media error
    act(() => {
      result.current.handleFileError(new Error("media error"), retryAction)
    })
    expect(result.current.error).toEqual({
      message: "Failed to process media file. The file might be corrupted.",
      retry: retryAction,
    })

    // Test generic error
    act(() => {
      result.current.handleFileError(new Error("unknown error"), retryAction)
    })
    expect(result.current.error).toEqual({
      message: "An unexpected error occurred while processing your file.",
      retry: retryAction,
    })
  })

  it("handles message errors correctly", () => {
    const { result } = renderHook(() => useChatErrors())
    const retryAction = jest.fn()

    act(() => {
      result.current.handleMessageError(retryAction)
    })
    expect(result.current.error).toEqual({
      message: "Failed to send message. Please try again.",
      retry: retryAction,
    })
  })

  it("clears errors correctly", () => {
    const { result } = renderHook(() => useChatErrors())
    const retryAction = jest.fn()

    // Set an error
    act(() => {
      result.current.handleMessageError(retryAction)
    })
    expect(result.current.error).not.toBeNull()

    // Clear the error
    act(() => {
      result.current.clearError()
    })
    expect(result.current.error).toBeNull()
  })
}) 