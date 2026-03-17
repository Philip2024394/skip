import React, { useState } from 'react';
import { Play, Video, Plus } from 'lucide-react';
import VideoPlayer from '@/features/video/components/VideoPlayer';
import { useNavigate } from 'react-router-dom';

// Default video for users who haven't uploaded
const DEFAULT_VIDEO_URL = "https://ik.imagekit.io/7grri5v7d/default-profile-video.mp4";

interface VideoContainerProps {
  profileId?: string;
  profileName?: string;
  userVideoUrl?: string;
  className?: string;
}

export default function VideoContainer({
  profileId,
  profileName = "Profile",
  userVideoUrl,
  className = ""
}: VideoContainerProps) {
  const navigate = useNavigate();
  const [userVideo, setUserVideo] = useState<string>(userVideoUrl || '');

  const handleVideoUpload = (file: File) => {
    // In a real implementation, you'd upload to your storage service
    // For now, we'll create a local URL
    const url = URL.createObjectURL(file);
    setUserVideo(url);
  };

  const handleContainerClick = () => {
    // Navigate to the full VideoPlaylistPage
    navigate(`/video-playlist/${profileId || 'default'}`, {
      state: { profileName, userVideoUrl: userVideo }
    });
  };

  const videoSrc = userVideo || DEFAULT_VIDEO_URL;

  return (
    <div
      className={`relative bg-black rounded-xl overflow-hidden cursor-pointer group ${className}`}
      onClick={handleContainerClick}
    >
      {/* Video Thumbnail/Preview */}
      <div className="aspect-video relative">
        <VideoPlayer
          src={videoSrc}
          showControls={false}
          autoPlay={false}
          className="w-full h-full"
        />

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-4 border border-white/30">
            <Play className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Video indicator */}
        <div className="absolute top-2 right-2">
          <div className="bg-black/60 backdrop-blur-sm rounded-full px-2 py-1 border border-white/20">
            <span className="text-white text-xs font-medium">
              {userVideo ? 'Your Video' : 'Default'}
            </span>
          </div>
        </div>
      </div>

      {/* Video Info */}
      <div className="p-3 bg-black/60">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-white text-sm font-medium">Video Intro</h4>
            <p className="text-white/60 text-xs">
              {userVideo ? 'Personal video' : 'Default video'}
            </p>
          </div>

          <div className="flex items-center gap-1">
            <Video className="w-4 h-4 text-white/60" />
            <span className="text-white/60 text-xs">0:30</span>
          </div>
        </div>
      </div>
    </div>
  );
}
