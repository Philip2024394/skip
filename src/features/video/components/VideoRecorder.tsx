import React, { useState, useRef } from 'react';
import { Camera, Video, VideoOff, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface VideoRecorderProps {
  onRecordingComplete?: (blob: Blob) => void;
  maxDuration?: number;
  className?: string;
}

export default function VideoRecorder({ 
  onRecordingComplete, 
  maxDuration = 30,
  className = ""
}: VideoRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string>('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: true
      });

      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      const mediaRecorder = new MediaRecorder(mediaStream, {
        mimeType: 'video/webm;codecs=vp8,opus'
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedBlob(blob);
        setRecordedUrl(url);
        
        if (onRecordingComplete) {
          onRecordingComplete(blob);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 0.1;
          if (newTime >= maxDuration) {
            stopRecording();
            return maxDuration;
          }
          return newTime;
        });
      }, 100);

    } catch (error) {
      console.error('Error accessing camera:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 0.1;
          if (newTime >= maxDuration) {
            stopRecording();
            return maxDuration;
          }
          return newTime;
        });
      }, 100);
    }
  };

  const resetRecording = () => {
    setRecordedBlob(null);
    setRecordedUrl('');
    setRecordingTime(0);
    
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
    }
  };

  const progress = (recordingTime / maxDuration) * 100;

  return (
    <div className={`relative bg-black rounded-xl overflow-hidden ${className}`}>
      {/* Video Preview */}
      <div className="relative aspect-video">
        {recordedUrl ? (
          <video
            src={recordedUrl}
            className="w-full h-full object-cover"
            controls
            playsInline
          />
        ) : stream ? (
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-black/60 flex flex-col items-center justify-center">
            <Camera className="w-12 h-12 text-white/60 mb-3" />
            <p className="text-white/60 text-sm">Camera not started</p>
          </div>
        )}

        {/* Recording Indicator */}
        {isRecording && (
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="text-white text-sm font-medium">
              {isPaused ? 'Paused' : 'Recording'}
            </span>
          </div>
        )}

        {/* Timer */}
        {isRecording && (
          <div className="absolute top-4 right-4">
            <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-white/20">
              <span className="text-white text-sm font-medium">
                {formatTime(recordingTime)} / {formatTime(maxDuration)}
              </span>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        {isRecording && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <Progress value={progress} className="h-2 bg-white/30" />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-4 bg-black/80">
        {!recordedUrl ? (
          <div className="flex items-center justify-center gap-4">
            {!isRecording ? (
              <Button
                onClick={startRecording}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                <Video className="w-5 h-5 mr-2" />
                Start Recording
              </Button>
            ) : (
              <>
                {!isPaused ? (
                  <Button
                    onClick={pauseRecording}
                    variant="outline"
                    className="border-white/30 text-white hover:bg-white/20"
                  >
                    <VideoOff className="w-5 h-5 mr-2" />
                    Pause
                  </Button>
                ) : (
                  <Button
                    onClick={resumeRecording}
                    className="bg-green-500 hover:bg-green-600 text-white"
                  >
                    <Video className="w-5 h-5 mr-2" />
                    Resume
                  </Button>
                )}
                
                <Button
                  onClick={stopRecording}
                  variant="outline"
                  className="border-red-500 text-red-500 hover:bg-red-500/20"
                >
                  <X className="w-5 h-5 mr-2" />
                  Stop
                </Button>
              </>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center gap-4">
            <Button
              onClick={resetRecording}
              variant="outline"
              className="border-white/30 text-white hover:bg-white/20"
            >
              <Camera className="w-5 h-5 mr-2" />
              Record New
            </Button>
            
            <Button
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              <Check className="w-5 h-5 mr-2" />
              Use Video
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
