import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Square, RotateCcw, Upload, Camera, X, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface VideoPlayerProps {
  src?: string;
  poster?: string;
  showControls?: boolean;
  autoPlay?: boolean;
  maxDuration?: number;
  onUpload?: (file: File) => void;
  showUploadButton?: boolean;
  className?: string;
}

export default function VideoPlayer({ 
  src, 
  poster, 
  showControls = true, 
  autoPlay = false,
  maxDuration = 30,
  onUpload,
  showUploadButton = true,
  className = ""
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => setDuration(video.duration);
    const handleEnded = () => setIsPlaying(false);

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('ended', handleEnded);
    };
  }, [src]);

  useEffect(() => {
    if (currentTime >= maxDuration && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = maxDuration;
      setIsPlaying(false);
    }
  }, [currentTime, maxDuration]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleStop = () => {
    if (!videoRef.current) return;
    videoRef.current.pause();
    videoRef.current.currentTime = 0;
    setIsPlaying(false);
  };

  const handleRewind = () => {
    if (!videoRef.current) return;
    const newTime = Math.max(0, currentTime - 5);
    videoRef.current.currentTime = newTime;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !onUpload) return;

    // Check if video file
    if (!file.type.startsWith('video/')) {
      return;
    }

    setIsUploading(true);
    
    // Create video element to check duration
    const tempVideo = document.createElement('video');
    tempVideo.preload = 'metadata';
    
    tempVideo.onloadedmetadata = () => {
      const videoDuration = tempVideo.duration;
      
      // If video is longer than maxDuration, trim it
      if (videoDuration > maxDuration) {
        // For now, we'll accept the file and let the player enforce the limit
        // In a real implementation, you'd want to trim the video server-side
      }
      
      onUpload(file);
      setIsUploading(false);
    };
    
    tempVideo.onerror = () => {
      setIsUploading(false);
    };
    
    tempVideo.src = URL.createObjectURL(file);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const displayTime = Math.min(currentTime, maxDuration);
  const displayDuration = Math.min(duration, maxDuration);

  return (
    <div className={`relative bg-black rounded-xl overflow-hidden ${className}`}>
      {/* Video Element */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full object-cover"
        autoPlay={autoPlay}
        playsInline
        muted
      />
      
      {/* Brand Overlay */}
      <div className="absolute top-4 right-4 pointer-events-none">
        <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-white/20">
          <span className="text-white text-sm font-medium">2DateMe</span>
        </div>
      </div>

      {/* Upload Button */}
      {showUploadButton && onUpload && (
        <div className="absolute top-4 left-4">
          <Button
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30"
          >
            {isUploading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      )}

      {/* Video Controls */}
      {showControls && src && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          {/* Control Buttons */}
          <div className="flex items-center justify-center gap-4 mb-3">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleRewind}
              className="text-white hover:bg-white/20"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
            
            <Button
              size="lg"
              onClick={togglePlay}
              className="bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 text-white"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5" />
              )}
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={handleStop}
              className="text-white hover:bg-white/20"
            >
              <Square className="w-4 h-4" />
            </Button>
          </div>

          {/* Progress Bar - Now at lowest position */}
          <div>
            <Progress value={progress} className="h-1 bg-white/30" />
            <div className="flex justify-between text-xs text-white/80 mt-1">
              <span>{formatTime(displayTime)}</span>
              <span>{formatTime(displayDuration)}</span>
            </div>
          </div>
        </div>
      )}

      {/* No Video State */}
      {!src && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60">
          <Camera className="w-12 h-12 text-white/60 mb-3" />
          <p className="text-white/60 text-sm">No video uploaded</p>
          {showUploadButton && onUpload && (
            <Button
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="mt-3 bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 text-white"
            >
              {isUploading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Video
                </>
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
