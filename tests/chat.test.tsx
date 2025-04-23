import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { ChatPage } from "@/app/chat/page"
import { useGemini } from "@/hooks/use-gemini"

// Mock the useGemini hook
jest.mock("@/hooks/use-gemini", () => ({
  useGemini: jest.fn(),
}))

describe("ChatPage", () => {
  const mockSendMessage = jest.fn()
  const mockAnalyzeContent = jest.fn()

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks()
    
    // Setup default mock implementation
    ;(useGemini as jest.Mock).mockImplementation(() => ({
      messages: [],
      setMessages: jest.fn(),
      isLoading: false,
      sendMessage: mockSendMessage,
      analyzeContent: mockAnalyzeContent,
    }))
  })

  it("renders the chat interface", () => {
    render(<ChatPage />)
    expect(screen.getByPlaceholderText("Type a message...")).toBeInTheDocument()
  })

  it("handles text message submission", async () => {
    mockSendMessage.mockResolvedValueOnce({
      id: "1",
      role: "assistant",
      content: "Test response",
    })

    render(<ChatPage />)
    
    const input = screen.getByPlaceholderText("Type a message...")
    const sendButton = screen.getByRole("button", { name: "Send" })

    fireEvent.change(input, { target: { value: "Hello" } })
    fireEvent.click(sendButton)

    await waitFor(() => {
      expect(mockSendMessage).toHaveBeenCalledWith("Hello")
    })
  })

  it("handles file upload and validation", async () => {
    const file = new File(["test content"], "test.pdf", { type: "application/pdf" })
    mockAnalyzeContent.mockResolvedValueOnce({
      id: "1",
      role: "assistant",
      content: "PDF analysis complete",
    })

    render(<ChatPage />)
    
    const fileInput = screen.getByTestId("file-input")
    fireEvent.change(fileInput, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByText("test.pdf")).toBeInTheDocument()
    })
  })

  it("shows error message for invalid file type", async () => {
    const invalidFile = new File(["test content"], "test.exe", { type: "application/exe" })
    
    render(<ChatPage />)
    
    const fileInput = screen.getByTestId("file-input")
    fireEvent.change(fileInput, { target: { files: [invalidFile] } })

    await waitFor(() => {
      expect(screen.getByText("Unsupported file type")).toBeInTheDocument()
    })
  })

  it("shows error message for large files", async () => {
    // Create a large file (11MB)
    const largeFile = new File(["x".repeat(11 * 1024 * 1024)], "large.pdf", { type: "application/pdf" })
    
    render(<ChatPage />)
    
    const fileInput = screen.getByTestId("file-input")
    fireEvent.change(fileInput, { target: { files: [largeFile] } })

    await waitFor(() => {
      expect(screen.getByText("File size exceeds 10MB limit")).toBeInTheDocument()
    })
  })

  it("handles PDF text extraction", async () => {
    const pdfFile = new File(["test content"], "test.pdf", { type: "application/pdf" })
    mockAnalyzeContent.mockResolvedValueOnce({
      id: "1",
      role: "assistant",
      content: "PDF analysis complete",
    })

    render(<ChatPage />)
    
    const fileInput = screen.getByTestId("file-input")
    fireEvent.change(fileInput, { target: { files: [pdfFile] } })

    await waitFor(() => {
      expect(mockAnalyzeContent).toHaveBeenCalledWith(
        "text",
        expect.any(String),
        "test.pdf",
        ""
      )
    })
  })

  it("handles media file processing", async () => {
    const videoFile = new File(["test content"], "test.mp4", { type: "video/mp4" })
    mockAnalyzeContent.mockResolvedValueOnce({
      id: "1",
      role: "assistant",
      content: "Video analysis complete",
    })

    render(<ChatPage />)
    
    const fileInput = screen.getByTestId("file-input")
    fireEvent.change(fileInput, { target: { files: [videoFile] } })

    await waitFor(() => {
      expect(mockAnalyzeContent).toHaveBeenCalledWith(
        "video",
        expect.any(String),
        "test.mp4",
        ""
      )
    })
  })
}) 