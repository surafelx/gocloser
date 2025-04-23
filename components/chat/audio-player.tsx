'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AudioPlayerProps {
  audioBlob: Blob;
  className?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export function AudioPlayer({ audioBlob, className, onConfirm, onCancel }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationRef = useRef<number | null>(null);

  // Create audio URL from blob
  useEffect(() => {
    if (!audioBlob) {
      console.error('No audio blob provided');
      return;
    }

    if (audioBlob.size === 0) {
      console.error('Empty audio blob (size is 0)');
      return;
    }

    try {
      console.log(`Creating audio URL from blob, size: ${audioBlob.size} bytes, type: ${audioBlob.type}`);
      const url = URL.createObjectURL(audioBlob);
      console.log('Created audio URL:', url);
      setAudioUrl(url);

      return () => {
        if (url) {
          console.log('Revoking object URL:', url);
          URL.revokeObjectURL(url);
        }
      };
    } catch (error) {
      console.error('Error creating object URL from blob:', error);
    }
  }, [audioBlob]);

  // Set up audio element
  useEffect(() => {
    if (!audioUrl) {
      console.log('No audio URL available, skipping audio element setup');
      return;
    }

    try {
      console.log('Setting up audio element with URL:', audioUrl);
      const audio = new Audio();

      // Add all event listeners before setting the src

      // Add error handler
      const handleError = (e: Event) => {
        const audioElement = e.target as HTMLAudioElement;
        console.error('Audio element error:', e);
        console.error('Audio error code:', audioElement.error?.code);
        console.error('Audio error message:', audioElement.error?.message);
      };
      audio.addEventListener('error', handleError);

      // Add loadedmetadata handler
      const handleMetadata = () => {
        console.log('Audio metadata loaded, duration:', audio.duration);
        setDuration(audio.duration || 0);
      };
      audio.addEventListener('loadedmetadata', handleMetadata);

      // Add canplaythrough handler
      audio.addEventListener('canplaythrough', () => {
        console.log('Audio can play through without buffering');
      });

      // Add ended handler
      const handleEnded = () => {
        console.log('Audio playback ended');
        setIsPlaying(false);
        setCurrentTime(0);
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
      audio.addEventListener('ended', handleEnded);

      // Set audio properties
      audio.preload = 'auto';
      audio.crossOrigin = 'anonymous';

      // Now set the source and load
      audio.src = audioUrl;
      audioRef.current = audio;

      console.log('Loading audio...');
      audio.load();

      return () => {
        console.log('Cleaning up audio element');
        audio.removeEventListener('error', handleError);
        audio.removeEventListener('loadedmetadata', handleMetadata);
        audio.removeEventListener('ended', handleEnded);
        audio.pause();
        audio.src = '';
        audioRef.current = null;
      };
    } catch (error) {
      console.error('Error setting up audio element:', error);
    }
  }, [audioUrl]);

  // Update time display during playback
  const updateTimeDisplay = () => {
    if (!audioRef.current) return;

    setCurrentTime(audioRef.current.currentTime);
    animationRef.current = requestAnimationFrame(updateTimeDisplay);
  };

  // Toggle play/pause
  const togglePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    } else {
      audioRef.current.play();
      animationRef.current = requestAnimationFrame(updateTimeDisplay);
    }

    setIsPlaying(!isPlaying);
  };

  // Restart playback
  const restart = () => {
    if (!audioRef.current) return;

    audioRef.current.currentTime = 0;
    setCurrentTime(0);

    if (!isPlaying) {
      togglePlayPause();
    }
  };

  // Handle time change from slider
  const handleTimeChange = (value: number[]) => {
    if (!audioRef.current) return;

    const newTime = value[0];
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);

    if (!isPlaying) {
      togglePlayPause();
    }
  };

  // Handle volume change
  const handleVolumeChange = (value: number[]) => {
    if (!audioRef.current) return;

    const newVolume = value[0];
    audioRef.current.volume = newVolume;
    setVolume(newVolume);

    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };

  // Toggle mute
  const toggleMute = () => {
    if (!audioRef.current) return;

    if (isMuted) {
      audioRef.current.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  // Format time display (mm:ss)
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <div className={cn('space-y-4 p-4 border rounded-lg bg-accent/10', className)}>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={togglePlayPause}
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={restart}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>

        <div className="flex-1 flex items-center gap-2">
          <span className="text-xs w-10 text-right">{formatTime(currentTime)}</span>
          <Slider
            value={[currentTime]}
            min={0}
            max={duration || 100}
            step={0.1}
            onValueChange={handleTimeChange}
            className="flex-1"
          />
          <span className="text-xs w-10">{formatTime(duration)}</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={toggleMute}
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>

          <Slider
            value={[isMuted ? 0 : volume]}
            min={0}
            max={1}
            step={0.01}
            onValueChange={handleVolumeChange}
            className="w-20"
          />
        </div>
      </div>

      {(onConfirm || onCancel) && (
        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button variant="outline" size="sm" onClick={onCancel}>
              Cancel
            </Button>
          )}
          {onConfirm && (
            <Button variant="default" size="sm" onClick={onConfirm}>
              Use Recording
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
