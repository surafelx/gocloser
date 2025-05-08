"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  FileText,
  Search,
  Clock,
  Users,
  Plus,
  Filter,
  SortDesc,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow } from "date-fns";
import { LoadingSpinner } from "@/components/chat/loading-spinner";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Transcript {
  id: string;
  title: string;
  originalFileName: string;
  fileType: string;
  duration: number;
  metadata: {
    speakers: number;
    words: number;
  };
  analysis: {
    sentiment: string;
    topics: string[];
  };
  createdAt: string;
}

export default function TranscriptsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Format duration from seconds to HH:MM:SS
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    return [
      hours > 0 ? hours.toString() + "h" : null,
      minutes > 0 ? minutes.toString() + "m" : null,
      secs > 0 ? secs.toString() + "s" : null,
    ].filter(Boolean).join(" ");
  };

  // Get file type icon
  const getFileTypeIcon = (fileType: string) => {
    if (fileType.startsWith("audio/")) {
      return "🎵";
    } else if (fileType.startsWith("video/")) {
      return "🎬";
    } else {
      return "📄";
    }
  };

  // Fetch transcripts
  const fetchTranscripts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/transcripts");
      
      if (!response.ok) {
        throw new Error("Failed to fetch transcripts");
      }
      
      const data = await response.json();
      setTranscripts(data.transcripts || []);
    } catch (error) {
      console.error("Error fetching transcripts:", error);
      toast({
        title: "Error",
        description: "Failed to load transcripts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle file upload
  const handleFileUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);
      
      const formData = new FormData();
      formData.append("file", selectedFile);
      
      const response = await fetch("/api/transcribe/deepgram", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload file");
      }
      
      const data = await response.json();
      
      toast({
        title: "Transcription complete",
        description: "Your file has been successfully transcribed and analyzed.",
      });
      
      // Close dialog and refresh transcripts
      setIsUploadDialogOpen(false);
      setSelectedFile(null);
      fetchTranscripts();
      
      // Navigate to the transcript detail page
      router.push(`/transcripts/${data.transcript.id}`);
    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Filter transcripts based on search query
  const filteredTranscripts = transcripts.filter((transcript) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      transcript.title.toLowerCase().includes(searchLower) ||
      transcript.analysis.topics.some(topic => topic.toLowerCase().includes(searchLower))
    );
  });

  // Load transcripts on component mount
  useEffect(() => {
    fetchTranscripts();
  }, []);

  return (
    <div className="container py-8 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Transcripts & Analysis</h1>
          <p className="text-muted-foreground">
            Upload audio or video files for transcription and AI analysis
          </p>
        </div>
        <Button onClick={() => setIsUploadDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> New Transcript
        </Button>
      </div>

      <div className="flex items-center space-x-2 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search transcripts..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <SortDesc className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Newest first</DropdownMenuItem>
            <DropdownMenuItem>Oldest first</DropdownMenuItem>
            <DropdownMenuItem>Longest duration</DropdownMenuItem>
            <DropdownMenuItem>Shortest duration</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>All types</DropdownMenuItem>
            <DropdownMenuItem>Audio only</DropdownMenuItem>
            <DropdownMenuItem>Video only</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" text="Loading transcripts..." />
        </div>
      ) : filteredTranscripts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTranscripts.map((transcript) => (
            <Card
              key={transcript.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => router.push(`/transcripts/${transcript.id}`)}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg line-clamp-1">{transcript.title}</CardTitle>
                  <span className="text-xl" title={transcript.fileType}>
                    {getFileTypeIcon(transcript.fileType)}
                  </span>
                </div>
                <CardDescription>
                  {formatDistanceToNow(new Date(transcript.createdAt), { addSuffix: true })}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="flex flex-wrap gap-1 mb-2">
                  {transcript.analysis.topics.slice(0, 3).map((topic, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {topic}
                    </Badge>
                  ))}
                  {transcript.analysis.topics.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{transcript.analysis.topics.length - 3} more
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{formatDuration(transcript.duration)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    <span>{transcript.metadata.speakers} speaker{transcript.metadata.speakers !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5" />
                    <span>{transcript.metadata.words.toLocaleString()} words</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-muted rounded-lg">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No transcripts found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery
              ? "No transcripts match your search. Try different keywords."
              : "Upload audio or video files to get started with transcription and analysis."}
          </p>
          {!searchQuery && (
            <Button onClick={() => setIsUploadDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Upload File
            </Button>
          )}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Audio or Video</DialogTitle>
            <DialogDescription>
              Upload a file for transcription and AI analysis. Supported formats: MP3, WAV, MP4, WebM.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              {selectedFile ? (
                <div>
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • {selectedFile.type}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={() => setSelectedFile(null)}
                  >
                    Change file
                  </Button>
                </div>
              ) : (
                <>
                  <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Drag and drop your file here, or click to browse
                  </p>
                  <Input
                    type="file"
                    className="hidden"
                    id="file-upload"
                    accept="audio/*,video/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setSelectedFile(file);
                    }}
                  />
                  <Button asChild variant="outline">
                    <label htmlFor="file-upload">Browse files</label>
                  </Button>
                </>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleFileUpload}
              disabled={!selectedFile || isUploading}
            >
              {isUploading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Uploading...
                </>
              ) : (
                "Upload & Transcribe"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
