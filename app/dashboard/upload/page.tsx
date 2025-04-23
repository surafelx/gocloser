"use client"

import type React from "react"

import { useState } from "react"
import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Mic, Upload, Video, X } from "lucide-react"
import { Progress } from "@/components/ui/progress"

export default function UploadPage() {
  const [activeTab, setActiveTab] = useState("video")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleUpload = () => {
    if (!selectedFile) return

    setUploading(true)
    setUploadProgress(0)

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setUploading(false)
          return 100
        }
        return prev + 10
      })
    }, 500)
  }

  const clearSelectedFile = () => {
    setSelectedFile(null)
    setUploadProgress(0)
  }

  return (
    <DashboardLayout>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Upload Content</h1>
          <p className="text-muted-foreground">Upload your sales content for AI analysis and feedback</p>
        </div>

        <Tabs defaultValue="video" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="video" className="flex items-center gap-2">
              <Video className="h-4 w-4" /> Video
            </TabsTrigger>
            <TabsTrigger value="audio" className="flex items-center gap-2">
              <Mic className="h-4 w-4" /> Audio
            </TabsTrigger>
            <TabsTrigger value="text" className="flex items-center gap-2">
              <FileText className="h-4 w-4" /> Text
            </TabsTrigger>
          </TabsList>

          <TabsContent value="video">
            <Card>
              <CardHeader>
                <CardTitle>Upload Video</CardTitle>
                <CardDescription>Upload a video of your sales call, presentation, or demo for analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {!selectedFile ? (
                    <div
                      className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => document.getElementById("video-upload")?.click()}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Video className="h-8 w-8 text-muted-foreground" />
                        <h3 className="font-medium text-lg">Upload a video file</h3>
                        <p className="text-sm text-muted-foreground">Drag and drop or click to browse</p>
                        <p className="text-xs text-muted-foreground">MP4, MOV, or AVI up to 500MB</p>
                        <Input
                          id="video-upload"
                          type="file"
                          accept="video/mp4,video/mov,video/avi"
                          className="hidden"
                          onChange={handleFileChange}
                        />
                        <Button variant="outline" size="sm" className="mt-2">
                          Select File
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="border rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Video className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{selectedFile.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={clearSelectedFile} disabled={uploading}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      {uploading && (
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Uploading...</span>
                            <span className="text-sm">{uploadProgress}%</span>
                          </div>
                          <Progress value={uploadProgress} className="h-2" />
                        </div>
                      )}

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="video-title">Title</Label>
                          <Input
                            id="video-title"
                            placeholder="E.g., Product Demo for Enterprise Client"
                            disabled={uploading}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="video-description">Description (optional)</Label>
                          <Input
                            id="video-description"
                            placeholder="Add details about this video"
                            disabled={uploading}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <Button onClick={handleUpload} disabled={!selectedFile || uploading} className="gap-2">
                      <Upload className="h-4 w-4" />
                      {uploading ? "Uploading..." : "Upload and Analyze"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audio">
            <Card>
              <CardHeader>
                <CardTitle>Upload Audio</CardTitle>
                <CardDescription>
                  Upload an audio recording of your sales call or conversation for analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {!selectedFile ? (
                    <div
                      className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => document.getElementById("audio-upload")?.click()}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Mic className="h-8 w-8 text-muted-foreground" />
                        <h3 className="font-medium text-lg">Upload an audio file</h3>
                        <p className="text-sm text-muted-foreground">Drag and drop or click to browse</p>
                        <p className="text-xs text-muted-foreground">MP3, WAV, or M4A up to 200MB</p>
                        <Input
                          id="audio-upload"
                          type="file"
                          accept="audio/mp3,audio/wav,audio/m4a"
                          className="hidden"
                          onChange={handleFileChange}
                        />
                        <Button variant="outline" size="sm" className="mt-2">
                          Select File
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="border rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Mic className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{selectedFile.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={clearSelectedFile} disabled={uploading}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      {uploading && (
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Uploading...</span>
                            <span className="text-sm">{uploadProgress}%</span>
                          </div>
                          <Progress value={uploadProgress} className="h-2" />
                        </div>
                      )}

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="audio-title">Title</Label>
                          <Input id="audio-title" placeholder="E.g., Sales Call with Prospect" disabled={uploading} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="audio-description">Description (optional)</Label>
                          <Input
                            id="audio-description"
                            placeholder="Add details about this audio"
                            disabled={uploading}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <Button onClick={handleUpload} disabled={!selectedFile || uploading} className="gap-2">
                      <Upload className="h-4 w-4" />
                      {uploading ? "Uploading..." : "Upload and Analyze"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="text">
            <Card>
              <CardHeader>
                <CardTitle>Upload Text</CardTitle>
                <CardDescription>
                  Upload a text document such as an email, script, or proposal for analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {!selectedFile ? (
                    <div
                      className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => document.getElementById("text-upload")?.click()}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                        <h3 className="font-medium text-lg">Upload a text file</h3>
                        <p className="text-sm text-muted-foreground">Drag and drop or click to browse</p>
                        <p className="text-xs text-muted-foreground">PDF, DOCX, or TXT up to 50MB</p>
                        <Input
                          id="text-upload"
                          type="file"
                          accept=".pdf,.docx,.txt"
                          className="hidden"
                          onChange={handleFileChange}
                        />
                        <Button variant="outline" size="sm" className="mt-2">
                          Select File
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="border rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{selectedFile.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={clearSelectedFile} disabled={uploading}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      {uploading && (
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Uploading...</span>
                            <span className="text-sm">{uploadProgress}%</span>
                          </div>
                          <Progress value={uploadProgress} className="h-2" />
                        </div>
                      )}

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="text-title">Title</Label>
                          <Input id="text-title" placeholder="E.g., Follow-up Email Template" disabled={uploading} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="text-description">Description (optional)</Label>
                          <Input
                            id="text-description"
                            placeholder="Add details about this document"
                            disabled={uploading}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <Button onClick={handleUpload} disabled={!selectedFile || uploading} className="gap-2">
                      <Upload className="h-4 w-4" />
                      {uploading ? "Uploading..." : "Upload and Analyze"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}

