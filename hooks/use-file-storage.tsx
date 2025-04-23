'use client';

import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';

// Define file type
interface StoredFile {
  id: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  summary: string;
  createdAt: Date;
}

// Define hook return type
interface UseFileStorageReturn {
  files: StoredFile[];
  isLoading: boolean;
  error: string | null;
  uploadFile: (file: File) => Promise<StoredFile | null>;
  getFiles: () => Promise<void>;
  getFile: (fileId: string) => Promise<StoredFile | null>;
  deleteFile: (fileId: string) => Promise<boolean>;
  getFileContent: (fileId: string) => Promise<Blob | null>;
}

export function useFileStorage(): UseFileStorageReturn {
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Get all files
  const getFiles = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/files');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get files');
      }

      setFiles(data.files);
    } catch (err: any) {
      setError(err.message || 'An error occurred while getting files');
      console.error('Get files error:', err);
      toast({
        title: 'Failed to get files',
        description: err.message || 'An error occurred while getting files',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Get a specific file
  const getFile = useCallback(async (fileId: string): Promise<StoredFile | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/files/${fileId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get file');
      }

      return data.file;
    } catch (err: any) {
      setError(err.message || 'An error occurred while getting file');
      console.error('Get file error:', err);
      toast({
        title: 'Failed to get file',
        description: err.message || 'An error occurred while getting file',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Upload a file
  const uploadFile = useCallback(async (file: File): Promise<StoredFile | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/files', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload file');
      }

      // Add the new file to the files array
      setFiles((prev) => [...prev, data.file]);

      toast({
        title: 'File uploaded successfully',
        description: `${file.name} has been uploaded and will be automatically deleted in 2 minutes.`,
      });

      return data.file;
    } catch (err: any) {
      setError(err.message || 'An error occurred while uploading file');
      console.error('Upload file error:', err);
      toast({
        title: 'Failed to upload file',
        description: err.message || 'An error occurred while uploading file',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Delete a file
  const deleteFile = useCallback(async (fileId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/files/${fileId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete file');
      }

      // Remove the file from the files array
      setFiles((prev) => prev.filter((file) => file.id !== fileId));

      toast({
        title: 'File deleted successfully',
      });

      return true;
    } catch (err: any) {
      setError(err.message || 'An error occurred while deleting file');
      console.error('Delete file error:', err);
      toast({
        title: 'Failed to delete file',
        description: err.message || 'An error occurred while deleting file',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Get file content
  const getFileContent = useCallback(async (fileId: string): Promise<Blob | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/files/${fileId}/content`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to get file content');
      }

      return await response.blob();
    } catch (err: any) {
      setError(err.message || 'An error occurred while getting file content');
      console.error('Get file content error:', err);
      toast({
        title: 'Failed to get file content',
        description: err.message || 'An error occurred while getting file content',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return {
    files,
    isLoading,
    error,
    uploadFile,
    getFiles,
    getFile,
    deleteFile,
    getFileContent,
  };
}
