'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';

interface UseAudioRecorderProps {
  onRecordingComplete?: (audioBlob: Blob, duration: number) => void;
}

interface UseAudioRecorderReturn {
  isRecording: boolean;
  recordingDuration: number;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  cancelRecording: () => void;
  recordingBlob: Blob | null;
  error: string | null;
}

export function useAudioRecorder({
  onRecordingComplete,
}: UseAudioRecorderProps = {}): UseAudioRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const { toast } = useToast();

  // Clean up function to stop recording and release resources
  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    mediaRecorderRef.current = null;
  }, [isRecording]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // Start recording function
  const startRecording = useCallback(async () => {
    try {
      // Check if MediaRecorder is available
      if (typeof MediaRecorder === 'undefined') {
        throw new Error('MediaRecorder is not supported in this browser');
      }

      console.log('Starting recording process...');
      setError(null);
      setRecordingBlob(null);
      setRecordingDuration(0);
      chunksRef.current = [];

      // Request microphone access with specific constraints
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      };

      console.log('Requesting microphone access with constraints:', constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      // Log available audio tracks
      const audioTracks = stream.getAudioTracks();
      console.log('Audio tracks:', audioTracks.length);
      audioTracks.forEach((track, i) => {
        console.log(`Track ${i}: enabled=${track.enabled}, muted=${track.muted}, label=${track.label}`);
      });

      // Get supported MIME types
      const mimeTypes = [
        'audio/webm',
        'audio/webm;codecs=opus',
        'audio/ogg;codecs=opus',
        'audio/mp4',
        'audio/mpeg'
      ];

      let selectedMimeType = '';
      for (const type of mimeTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          selectedMimeType = type;
          console.log(`Using MIME type: ${type}`);
          break;
        }
      }

      if (!selectedMimeType) {
        selectedMimeType = ''; // Let browser choose
        console.warn('No supported MIME types found, using browser default');
      }

      // Create media recorder with options
      const options = { mimeType: selectedMimeType };
      console.log('Creating MediaRecorder with options:', options);
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      console.log('MediaRecorder state:', mediaRecorder.state);
      console.log('MediaRecorder mimeType:', mediaRecorder.mimeType);

      // Set up event handlers
      mediaRecorder.ondataavailable = (event) => {
        console.log(`Data available event fired, data size: ${event.data.size} bytes`);
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
          console.log(`Added chunk, total chunks: ${chunksRef.current.length}`);
        }
      };

      mediaRecorder.onstop = () => {
        console.log('MediaRecorder stopped, processing chunks...');
        // Make sure we have chunks before creating a blob
        if (chunksRef.current.length > 0) {
          console.log(`Creating blob from ${chunksRef.current.length} chunks`);
          // Use audio/webm MIME type for better compatibility
          const audioBlob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
          setRecordingBlob(audioBlob);

          console.log(`Recording completed, blob size: ${audioBlob.size} bytes, type: ${audioBlob.type}`);

          if (onRecordingComplete) {
            console.log('Calling onRecordingComplete callback');
            onRecordingComplete(audioBlob, recordingDuration);
          }
        } else {
          console.error('No audio data recorded (chunks array is empty)');
          setError('No audio data recorded. Please try again.');
        }
      };

      // Add event listeners for all MediaRecorder events
      mediaRecorder.addEventListener('start', () => console.log('MediaRecorder start event fired'));
      mediaRecorder.addEventListener('error', (e) => console.error('MediaRecorder error:', e));
      mediaRecorder.addEventListener('pause', () => console.log('MediaRecorder pause event fired'));
      mediaRecorder.addEventListener('resume', () => console.log('MediaRecorder resume event fired'));

      // Add ondataavailable event handler as a separate listener
      mediaRecorder.addEventListener('dataavailable', (event) => {
        console.log(`Data available listener: data size: ${event.data.size} bytes`);
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      });

      // Start recording with a timeslice of 1000ms to get data during recording
      console.log('Starting MediaRecorder with 1000ms timeslice');
      mediaRecorder.start(1000);
      setIsRecording(true);
      console.log('Recording started, MediaRecorder state:', mediaRecorder.state);

      // Start duration timer
      intervalRef.current = setInterval(() => {
        setRecordingDuration(prev => {
          const newDuration = prev + 1;
          console.log(`Recording duration: ${newDuration}s`);
          return newDuration;
        });
      }, 1000);

    } catch (err: any) {
      console.error('Error starting recording:', err);
      setError(err.message || 'Failed to start recording');

      toast({
        title: 'Microphone access denied',
        description: 'Please allow microphone access to record audio.',
        variant: 'destructive',
      });
    }
  }, [onRecordingComplete, recordingDuration, toast]);

  // Stop recording function
  const stopRecording = useCallback(() => {
    console.log('Stopping recording...');
    if (!mediaRecorderRef.current) {
      console.error('No MediaRecorder instance found');
      setError('No active recording to stop');
      return;
    }

    if (!isRecording) {
      console.warn('Not currently recording, nothing to stop');
      return;
    }

    try {
      console.log('MediaRecorder state before stopping:', mediaRecorderRef.current.state);

      // Request a final dataavailable event
      if (mediaRecorderRef.current.state === 'recording') {
        console.log('Stopping MediaRecorder...');
        mediaRecorderRef.current.stop();
        console.log('MediaRecorder stopped');
      } else {
        console.warn(`MediaRecorder is in ${mediaRecorderRef.current.state} state, not stopping`);
        // Force a dataavailable event if possible
        if (mediaRecorderRef.current.state === 'inactive' && chunksRef.current.length === 0) {
          console.log('Trying to request data from inactive recorder...');
          try {
            mediaRecorderRef.current.requestData();
          } catch (e) {
            console.error('Error requesting data:', e);
          }
        }
      }

      setIsRecording(false);

      // Stop the duration timer
      if (intervalRef.current) {
        console.log('Clearing interval timer');
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      // Stop all tracks in the stream
      if (streamRef.current) {
        console.log('Stopping audio tracks...');
        streamRef.current.getTracks().forEach(track => {
          console.log(`Stopping track: ${track.label}`);
          track.stop();
        });
      }

      // If we have no chunks but recording was active, create an empty recording
      if (chunksRef.current.length === 0) {
        console.warn('No audio chunks recorded, creating empty blob');
        const emptyBlob = new Blob([], { type: 'audio/webm' });
        setRecordingBlob(emptyBlob);
        setError('No audio data was captured. Please check your microphone and try again.');

        if (onRecordingComplete) {
          onRecordingComplete(emptyBlob, recordingDuration);
        }
      }
    } catch (err: any) {
      console.error('Error stopping recording:', err);
      setError(err.message || 'Failed to stop recording');
    }
  }, [isRecording, recordingDuration, onRecordingComplete]);

  // Cancel recording function
  const cancelRecording = useCallback(() => {
    cleanup();
    setIsRecording(false);
    setRecordingDuration(0);
    setRecordingBlob(null);
    chunksRef.current = [];
  }, [cleanup]);

  return {
    isRecording,
    recordingDuration,
    startRecording,
    stopRecording,
    cancelRecording,
    recordingBlob,
    error,
  };
}
