"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TranscriptViewer } from "@/components/transcripts/transcript-viewer";
import { LoadingSpinner } from "@/components/chat/loading-spinner";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface TranscriptPageProps {
  params: {
    id: string;
  };
}

export default function TranscriptPage({ params }: TranscriptPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [transcript, setTranscript] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Fetch transcript data
  const fetchTranscript = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/transcripts/${params.id}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch transcript");
      }
      
      const data = await response.json();
      setTranscript(data.transcript);
    } catch (error) {
      console.error("Error fetching transcript:", error);
      toast({
        title: "Error",
        description: "Failed to load transcript. Please try again.",
        variant: "destructive",
      });
      router.push("/transcripts");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle transcript deletion
  const handleDeleteTranscript = async () => {
    try {
      setIsDeleting(true);
      
      const response = await fetch(`/api/transcripts/${params.id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete transcript");
      }
      
      toast({
        title: "Transcript deleted",
        description: "The transcript has been successfully deleted.",
      });
      
      router.push("/transcripts");
    } catch (error) {
      console.error("Error deleting transcript:", error);
      toast({
        title: "Error",
        description: "Failed to delete transcript. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  // Load transcript on component mount
  useEffect(() => {
    fetchTranscript();
  }, [params.id]);

  return (
    <div className="container py-8 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <Button
          variant="ghost"
          className="flex items-center gap-2"
          onClick={() => router.push("/transcripts")}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Transcripts
        </Button>
        
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={isLoading || isDeleting}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Transcript
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the transcript
                and all associated analysis.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteTranscript}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" text="Loading transcript..." />
        </div>
      ) : transcript ? (
        <TranscriptViewer transcript={transcript} />
      ) : (
        <div className="text-center py-12 bg-muted rounded-lg">
          <h3 className="text-lg font-medium mb-2">Transcript not found</h3>
          <p className="text-muted-foreground mb-4">
            The transcript you're looking for doesn't exist or has been deleted.
          </p>
          <Button onClick={() => router.push("/transcripts")}>
            Go to Transcripts
          </Button>
        </div>
      )}
    </div>
  );
}
