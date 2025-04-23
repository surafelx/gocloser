import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { Chat } from "@/components/chat/chat"
import { BotAvatar } from "@/components/chat/bot-avatar"
import { FileUpload } from "@/components/chat/file-upload"
import { ErrorMessage } from "@/components/chat/error-message"
import { LoadingSpinner } from "@/components/chat/loading-spinner"
import { describe, it, expect, vi } from 'vitest'

describe("Chat Components", () => {
  describe("BotAvatar", () => {
    it("renders the robot avatar", () => {
      render(<BotAvatar />)
      const avatar = screen.getByRole("img")
      expect(avatar).toBeInTheDocument()
      expect(avatar).toHaveAttribute("src", "/robot-avatar.svg")
    })
  })

  describe("FileUpload", () => {
    it("renders the file upload button", () => {
      const onFileSelect = jest.fn()
      render(<FileUpload onFileSelect={onFileSelect} />)
      const uploadButton = screen.getByLabelText("Upload file")
      expect(uploadButton).toBeInTheDocument()
    })

    it("handles file selection", async () => {
      const onFileSelect = jest.fn()
      render(<FileUpload onFileSelect={onFileSelect} />)
      const file = new File(["test content"], "test.pdf", { type: "application/pdf" })
      const input = screen.getByLabelText("Upload file")
      
      fireEvent.change(input, { target: { files: [file] } })
      await waitFor(() => {
        expect(onFileSelect).toHaveBeenCalledWith(file)
      })
    })
  })

  describe("ErrorMessage", () => {
    it("renders error message with retry button", () => {
      const onRetry = jest.fn()
      render(<ErrorMessage message="Test error" onRetry={onRetry} />)
      
      expect(screen.getByText("Test error")).toBeInTheDocument()
      const retryButton = screen.getByRole("button", { name: "Retry" })
      expect(retryButton).toBeInTheDocument()
      
      fireEvent.click(retryButton)
      expect(onRetry).toHaveBeenCalled()
    })
  })

  describe("LoadingSpinner", () => {
    it("renders loading spinner with text", () => {
      render(<LoadingSpinner text="Loading..." />)
      expect(screen.getByText("Loading...")).toBeInTheDocument()
      expect(screen.getByRole("status")).toBeInTheDocument()
    })

    it("renders loading spinner without text", () => {
      render(<LoadingSpinner />)
      expect(screen.getByRole("status")).toBeInTheDocument()
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument()
    })
  })

  describe("Chat", () => {
    it("renders chat interface", () => {
      render(<Chat />)
      expect(screen.getByPlaceholderText('Type your message here...')).toBeInTheDocument()
      expect(screen.getByText('Upload File')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument()
    })

    it("handles message input and submission", async () => {
      render(<Chat />)
      const input = screen.getByPlaceholderText('Type your message here...')
      const sendButton = screen.getByRole('button', { name: /send/i })

      fireEvent.change(input, { target: { value: 'Test message' } })
      expect(input).toHaveValue('Test message')

      fireEvent.click(sendButton)
      await waitFor(() => {
        expect(input).toHaveValue('')
      })
    })
  })
}) 