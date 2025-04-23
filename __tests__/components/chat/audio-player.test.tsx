import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AudioPlayer } from '@/components/chat/audio-player';

// Mock the Audio API
const mockPlay = jest.fn();
const mockPause = jest.fn();
const mockAddEventListener = jest.fn();

// Mock the URL.createObjectURL and URL.revokeObjectURL
const mockCreateObjectURL = jest.fn().mockReturnValue('mock-audio-url');
const mockRevokeObjectURL = jest.fn();

// Store the original implementations
const originalCreateObjectURL = URL.createObjectURL;
const originalRevokeObjectURL = URL.revokeObjectURL;

describe('AudioPlayer Component', () => {
  beforeAll(() => {
    // Mock Audio class
    window.Audio = jest.fn().mockImplementation(() => ({
      play: mockPlay,
      pause: mockPause,
      addEventListener: mockAddEventListener,
      currentTime: 0,
      duration: 100,
      volume: 1,
    }));
    
    // Mock URL methods
    URL.createObjectURL = mockCreateObjectURL;
    URL.revokeObjectURL = mockRevokeObjectURL;
    
    // Mock requestAnimationFrame
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => {
      cb(0);
      return 0;
    });
    
    // Mock cancelAnimationFrame
    jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
  });
  
  afterAll(() => {
    // Restore original implementations
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
    
    // Restore requestAnimationFrame and cancelAnimationFrame
    window.requestAnimationFrame.mockRestore();
    window.cancelAnimationFrame.mockRestore();
  });
  
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });
  
  test('renders correctly with audio blob', () => {
    const audioBlob = new Blob(['mock audio data'], { type: 'audio/mp3' });
    render(<AudioPlayer audioBlob={audioBlob} />);
    
    // Check that play button is rendered
    expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
    
    // Check that restart button is rendered
    expect(screen.getByRole('button', { name: /restart/i })).toBeInTheDocument();
    
    // Check that volume button is rendered
    expect(screen.getByRole('button', { name: /volume/i })).toBeInTheDocument();
    
    // Check that time displays are rendered
    expect(screen.getByText('0:00')).toBeInTheDocument();
    expect(screen.getByText('1:40')).toBeInTheDocument(); // 100 seconds formatted as 1:40
  });
  
  test('plays audio when play button is clicked', async () => {
    const audioBlob = new Blob(['mock audio data'], { type: 'audio/mp3' });
    render(<AudioPlayer audioBlob={audioBlob} />);
    
    // Click the play button
    const playButton = screen.getByRole('button', { name: /play/i });
    await userEvent.click(playButton);
    
    // Check that play was called
    expect(mockPlay).toHaveBeenCalledTimes(1);
  });
  
  test('pauses audio when pause button is clicked', async () => {
    const audioBlob = new Blob(['mock audio data'], { type: 'audio/mp3' });
    render(<AudioPlayer audioBlob={audioBlob} />);
    
    // Click the play button first
    const playButton = screen.getByRole('button', { name: /play/i });
    await userEvent.click(playButton);
    
    // Now the button should be a pause button
    const pauseButton = screen.getByRole('button', { name: /pause/i });
    await userEvent.click(pauseButton);
    
    // Check that pause was called
    expect(mockPause).toHaveBeenCalledTimes(1);
  });
  
  test('calls onConfirm when confirm button is clicked', async () => {
    const audioBlob = new Blob(['mock audio data'], { type: 'audio/mp3' });
    const onConfirm = jest.fn();
    render(<AudioPlayer audioBlob={audioBlob} onConfirm={onConfirm} />);
    
    // Click the confirm button
    const confirmButton = screen.getByRole('button', { name: /use recording/i });
    await userEvent.click(confirmButton);
    
    // Check that onConfirm was called
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
  
  test('calls onCancel when cancel button is clicked', async () => {
    const audioBlob = new Blob(['mock audio data'], { type: 'audio/mp3' });
    const onCancel = jest.fn();
    render(<AudioPlayer audioBlob={audioBlob} onCancel={onCancel} />);
    
    // Click the cancel button
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await userEvent.click(cancelButton);
    
    // Check that onCancel was called
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
  
  test('toggles mute when volume button is clicked', async () => {
    const audioBlob = new Blob(['mock audio data'], { type: 'audio/mp3' });
    render(<AudioPlayer audioBlob={audioBlob} />);
    
    // Click the volume button
    const volumeButton = screen.getByRole('button', { name: /volume/i });
    await userEvent.click(volumeButton);
    
    // Now the button should be a mute button
    expect(screen.getByRole('button', { name: /mute/i })).toBeInTheDocument();
  });
});
