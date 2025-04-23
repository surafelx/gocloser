import { useFileValidation } from "@/hooks/use-file-validation"

describe("useFileValidation", () => {
  const { validateFile, getFileType } = useFileValidation()

  it("validates file size correctly", () => {
    const largeFile = new File(["x".repeat(11 * 1024 * 1024)], "large.pdf", { type: "application/pdf" })
    const result = validateFile(largeFile)
    expect(result).toEqual({
      message: "File size exceeds 10MB limit. Please upload a smaller file.",
      code: "SIZE",
    })
  })

  it("validates file types correctly", () => {
    const invalidFile = new File(["test"], "test.exe", { type: "application/exe" })
    const result = validateFile(invalidFile)
    expect(result).toEqual({
      message: "Unsupported file type. Please upload a video, audio, or PDF file.",
      code: "TYPE",
    })
  })

  it("accepts valid file types", () => {
    const validFiles = [
      new File(["test"], "test.pdf", { type: "application/pdf" }),
      new File(["test"], "test.mp4", { type: "video/mp4" }),
      new File(["test"], "test.mp3", { type: "audio/mpeg" }),
    ]

    validFiles.forEach((file) => {
      expect(validateFile(file)).toBeNull()
    })
  })

  it("identifies file types correctly", () => {
    const testCases = [
      { file: new File(["test"], "test.mp3", { type: "audio/mpeg" }), expected: "audio" },
      { file: new File(["test"], "test.mp4", { type: "video/mp4" }), expected: "video" },
      { file: new File(["test"], "test.pdf", { type: "application/pdf" }), expected: "text" },
    ]

    testCases.forEach(({ file, expected }) => {
      expect(getFileType(file)).toBe(expected)
    })
  })
}) 