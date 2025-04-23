import { ChangeEvent, useRef, useState } from "react"
import { FileText, Paperclip, Video, Mic, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface FileUploadProps {
  onFileSelect: (file: File) => void
  onClear: () => void
  selectedFile: File | null
  uploadProgress: number
  uploading: boolean
  isRecording?: boolean
}

export function FileUpload({
  onFileSelect,
  onClear,
  selectedFile,
  uploadProgress,
  uploading,
  isRecording,
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files[0])
    }
  }

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files[0])
    }
  }

  const handleFiles = (file: File) => {
    const validTypes = {
      video: ["video/mp4", "video/webm", "video/ogg"],
      audio: ["audio/mpeg", "audio/wav", "audio/ogg"],
      pdf: ["application/pdf"],
    }

    // Check if file type is valid
    const isValidType = [
      ...validTypes.video,
      ...validTypes.audio,
      ...validTypes.pdf,
    ].includes(file.type)

    if (!isValidType) {
      console.error(`Invalid file type: ${file.type}`);
      alert(`Invalid file type. Please upload one of the following:\n- Video: MP4, WebM, OGG\n- Audio: MP3, WAV, OGG\n- Document: PDF`);
      return;
    }

    // Check file size (max 10MB for better performance)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      console.error(`File too large: ${file.size} bytes`);
      alert("File is too large. Maximum size is 10MB for better performance.");
      return;
    }

    // For PDF files, do additional validation
    if (file.type === "application/pdf") {
      // Check file name for potential issues
      if (file.name.includes("%") || file.name.includes("#") || file.name.includes("&")) {
        console.error(`PDF filename contains special characters: ${file.name}`);
        alert("Please rename your PDF file to remove special characters (%, #, &) before uploading.");
        return;
      }
    }

    try {
      onFileSelect(file);
    } catch (error) {
      console.error("Error processing file:", error);
      alert("An error occurred while processing your file. Please try again with a different file or contact support if the issue persists.");
    }
  }

  const triggerFileInput = () => {
    if (uploading) {
      return; // Prevent selecting new file while uploading
    }
    fileInputRef.current?.click();
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith("video/")) return <Video className="h-4 w-4" />
    if (type.startsWith("audio/")) return <Mic className="h-4 w-4" />
    return <FileText className="h-4 w-4" />
  }

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        accept=".mp4,.webm,.ogg,.mp3,.wav,.pdf"
        className="hidden"
      />

      {!selectedFile && !isRecording && (
        <div
          className={cn(
            "flex items-center justify-center w-full h-24 border-2 border-dashed rounded-lg transition-colors",
            dragActive
              ? "border-primary bg-primary/10"
              : "border-gray-300 hover:border-primary"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={triggerFileInput}
        >
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Paperclip className="h-4 w-4" />
            <span>Drop files here or click to upload</span>
          </div>
        </div>
      )}

      {selectedFile && (
        <div className="flex items-center gap-2 p-2 border rounded-lg">
          {getFileIcon(selectedFile.type)}
          <span className="text-sm truncate flex-1">{selectedFile.name}</span>
          {uploading ? (
            <Progress value={uploadProgress} className="w-20" />
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onClear}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  )
}