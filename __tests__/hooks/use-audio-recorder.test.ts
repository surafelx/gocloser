import { renderHook, act } from '@testing-library/react';
import { useAudioRecorder } from '@/hooks/use-audio-recorder';

// Mock the MediaRecorder API
const mockStart = jest.fn();
const mockStop = jest.fn();
const mockPause = jest.fn();
const mockResume = jest.fn();
const mockRequestData = jest.fn();

// Mock the MediaStream API
const mockGetTracks = jest.fn().mockReturnValue([
  { stop: jest.fn() }
]);

// Mock the navigator.mediaDevices.getUserMedia
const mockGetUserMedia = jest.fn().mockResolvedValue({
  getTracks: mockGetTracks
});

describe('useAudioRecorder Hook', () => {
  beforeAll(() => {
    // Mock navigator.mediaDevices
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: {
        getUserMedia: mockGetUserMedia
      },
      writable: true
    });
    
    // Mock MediaRecorder
    global.MediaRecorder = jest.fn().mockImplementation(() => ({
      start: mockStart,
      stop: mockStop,
      pause: mockPause,
      resume: mockResume,
      requestData: mockRequestData,
      state: 'inactive',
      ondataavailable: null,
      onstop: null,
      onerror: null
    }));
    
    // Mock window.URL.createObjectURL
    global.URL.createObjectURL = jest.fn().mockReturnValue('mock-audio-url');
    
    // Mock requestAnimationFrame
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => {
      cb(0);
      return 0;
    });
    
    // Mock clearInterval
    jest.spyOn(global, 'clearInterval').mockImplementation(() => {});
    
    // Mock setInterval
    jest.spyOn(global, 'setInterval').mockImplementation((cb) => {
      cb();
      return 123 as unknown as NodeJS.Timeout;
    });
  });
  
  afterAll(() => {
    // Restore mocks
    jest.restoreAllMocks();
  });
  
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });
  
  test('initializes with correct default values', () => {
    const { result } = renderHook(() => useAudioRecorder());
    
    expect(result.current.isRecording).toBe(false);
    expect(result.current.recordingDuration).toBe(0);
    expect(result.current.recordingBlob).toBe(null);
    expect(result.current.error).toBe(null);
  });
  
  test('starts recording when startRecording is called', async () => {
    const { result } = renderHook(() => useAudioRecorder());
    
    await act(async () => {
      await result.current.startRecording();
    });
    
    expect(mockGetUserMedia).toHaveBeenCalledWith({ audio: true });
    expect(mockStart).toHaveBeenCalled();
    expect(result.current.isRecording).toBe(true);
  });
  
  test('stops recording when stopRecording is called', async () => {
    const { result } = renderHook(() => useAudioRecorder());
    
    // Start recording first
    await act(async () => {
      await result.current.startRecording();
    });
    
    // Then stop recording
    act(() => {
      result.current.stopRecording();
    });
    
    expect(mockStop).toHaveBeenCalled();
    expect(result.current.isRecording).toBe(false);
  });
  
  test('cancels recording when cancelRecording is called', async () => {
    const { result } = renderHook(() => useAudioRecorder());
    
    // Start recording first
    await act(async () => {
      await result.current.startRecording();
    });
    
    // Then cancel recording
    act(() => {
      result.current.cancelRecording();
    });
    
    expect(mockStop).toHaveBeenCalled();
    expect(result.current.isRecording).toBe(false);
    expect(result.current.recordingDuration).toBe(0);
    expect(result.current.recordingBlob).toBe(null);
  });
  
  test('calls onRecordingComplete when recording is stopped', async () => {
    const onRecordingComplete = jest.fn();
    const { result } = renderHook(() => useAudioRecorder({ onRecordingComplete }));
    
    // Start recording
    await act(async () => {
      await result.current.startRecording();
    });
    
    // Simulate ondataavailable event
    const mockBlob = new Blob(['mock audio data'], { type: 'audio/mp3' });
    act(() => {
      const mediaRecorder = (global.MediaRecorder as jest.Mock).mock.results[0].value;
      mediaRecorder.ondataavailable({ data: mockBlob });
    });
    
    // Simulate onstop event
    act(() => {
      const mediaRecorder = (global.MediaRecorder as jest.Mock).mock.results[0].value;
      mediaRecorder.onstop();
    });
    
    // Stop recording
    act(() => {
      result.current.stopRecording();
    });
    
    // Check that onRecordingComplete was called with the blob and duration
    expect(onRecordingComplete).toHaveBeenCalledWith(expect.any(Blob), expect.any(Number));
  });
  
  test('handles errors when getUserMedia fails', async () => {
    // Mock getUserMedia to reject
    mockGetUserMedia.mockRejectedValueOnce(new Error('Permission denied'));
    
    const { result } = renderHook(() => useAudioRecorder());
    
    await act(async () => {
      await result.current.startRecording();
    });
    
    expect(result.current.error).toBe('Permission denied');
    expect(result.current.isRecording).toBe(false);
  });
});
