interface FileValidationError {
  message: string
  code: "SIZE" | "TYPE" | "CORRUPT"
}

export function useFileValidation() {
  const validateFile = (file: File): FileValidationError | null => {
    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return {
        message: "File size exceeds 10MB limit. Please upload a smaller file.",
        code: "SIZE",
      }
    }

    // Check file type
    const validTypes = {
      video: ["video/mp4", "video/webm", "video/ogg", "video/quicktime"],
      audio: ["audio/mpeg", "audio/wav", "audio/ogg", "audio/mp3", "audio/mp4", "audio/x-m4a"],
      pdf: ["application/pdf"],
      document: [
        "text/plain",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation"
      ],
    }

    const isValidType = [
      ...validTypes.video,
      ...validTypes.audio,
      ...validTypes.pdf,
      ...validTypes.document,
    ].includes(file.type)

    if (!isValidType) {
      return {
        message: "Unsupported file type. Please upload a video, audio, PDF, or document file.",
        code: "TYPE",
      }
    }

    return null
  }

  const getFileType = (file: File): "video" | "audio" | "text" => {
    if (file.type.startsWith("audio/")) return "audio"
    if (file.type.startsWith("video/")) return "video"
    if (file.type === "application/pdf") return "text"
    if (file.type.startsWith("text/") ||
        file.type.startsWith("application/msword") ||
        file.type.startsWith("application/vnd.openxmlformats-officedocument") ||
        file.type.startsWith("application/vnd.ms-")) {
      return "text"
    }
    return "text"
  }

  return {
    validateFile,
    getFileType,
  }
}