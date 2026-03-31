import React, { useState } from 'react';
import { ChevronLeft, Play, Video, Plus } from 'lucide-react';
import { Button } from '@/shared/components/button';
import { VideoPlayer } from '@/features/video/components';
import { VideoRecorder } from '@/features/video/components';
import { useNavigate } from 'react-router-dom';

// Default video for users who haven't uploaded
const DEFAULT_VIDEO_URL = "https://ik.imagekit.io/7grri5v7d/default-profile-video.mp4";

interface VideoPlaylistPageProps {
  profileId?: string;
  profileName?: string;
}

export default function VideoPlaylistPage({ profileId, profileName = "Profile" }: VideoPlaylistPageProps) {
  const navigate = useNavigate();
  const [userVideo, setUserVideo] = useState<string>('');
  const [showRecorder, setShowRecorder] = useState(false);
  const [activeTab, setActiveTab] = useState<'playlist' | 'record'>('playlist');

  const handleVideoUpload = (file: File) => {
    // In a real implementation, you'd upload to your storage service
    // For now, we'll create a local URL
    const url = URL.createObjectURL(file);
    setUserVideo(url);
    setShowRecorder(false);
    setActiveTab('playlist');
  };

  const handleRecordingComplete = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    setUserVideo(url);
  };

  const videoSrc = userVideo || DEFAULT_VIDEO_URL;

  return (
    <div className="h-full w-full">
      <div
        className="relative z-10 h-full w-full px-2 py-2"
      >
        <div
          className="h-full w-full rounded-2xl bg-gradient-to-br from-fuchsia-900/25 via-black/35 to-purple-900/25 backdrop-blur-md border-2 border-fuchsia-300/25 ring-1 ring-fuchsia-300/15 shadow-[0_8px_24px_rgba(0,0,0,0.55)] flex px-4 py-3 items-center justify-center"
        >
          <div className="h-full w-full flex flex-col">
            {/* Header with brand name */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <button
                onClick={() => navigate(-1)}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 20, border: "1.5px solid rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.15)", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
              >
                ← Back
              </button>

              <h1 className="text-white text-lg font-semibold">
                2DateMe Video
              </h1>

              <div className="w-16" /> {/* Spacer for balance */}
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 py-3">
              <Button
                variant={activeTab === 'playlist' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('playlist')}
                className={activeTab === 'playlist' ? 'bg-white/20 text-white border border-white/30' : 'text-white/60 hover:text-white hover:bg-white/10'}
              >
                <Play className="w-4 h-4 mr-2" />
                Playlist
              </Button>

              <Button
                variant={activeTab === 'record' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('record')}
                className={activeTab === 'record' ? 'bg-white/20 text-white border border-white/30' : 'text-white/60 hover:text-white hover:bg-white/10'}
              >
                <Video className="w-4 h-4 mr-2" />
                Record
              </Button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto scrollbar-pink">
              {activeTab === 'playlist' ? (
                <div className="space-y-4">
                  {/* Main Video Player - Full width container */}
                  <div className="relative rounded-2xl overflow-hidden bg-black/40 backdrop-blur-xl border-2 border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.4),0_2px_8px_rgba(0,0,0,0.3)] ring-1 ring-white/5 isolate">
                    <VideoPlayer
                      src={videoSrc}
                      showControls={true}
                      showUploadButton={true}
                      onUpload={handleVideoUpload}
                      className="aspect-video"
                    />
                  </div>

                  {/* Video Info Card */}
                  <div className="bg-black/40 backdrop-blur-xl rounded-2xl border-2 border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.4),0_2px_8px_rgba(0,0,0,0.3)] ring-1 ring-white/5 isolate p-4">
                    <h3 className="text-white font-semibold mb-2 text-lg">
                      {userVideo ? 'Your Video' : 'Default Video'}
                    </h3>
                    <p className="text-white/70 text-sm leading-relaxed">
                      {userVideo
                        ? 'This is your uploaded video. Maximum 30 seconds duration with automatic optimization for mobile viewing.'
                        : 'This is the default video that appears when no personal video has been uploaded. Upload your own video to personalize your profile and make a great first impression.'
                      }
                    </p>

                    <div className="mt-4 flex items-center gap-4 text-white/50 text-sm">
                      <div className="flex items-center gap-1">
                        <Video className="w-4 h-4" />
                        <span>Duration: 0:30 max</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Play className="w-4 h-4" />
                        <span>Format: Mobile optimized</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Video Recorder - Full width container */}
                  <div className="relative rounded-2xl overflow-hidden bg-black/40 backdrop-blur-xl border-2 border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.4),0_2px_8px_rgba(0,0,0,0.3)] ring-1 ring-white/5 isolate">
                    <VideoRecorder
                      onRecordingComplete={handleRecordingComplete}
                      maxDuration={30}
                      className="aspect-video"
                    />
                  </div>

                  {/* Recording Tips Card */}
                  <div className="bg-black/40 backdrop-blur-xl rounded-2xl border-2 border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.4),0_2px_8px_rgba(0,0,0,0.3)] ring-1 ring-white/5 isolate p-4">
                    <h3 className="text-white font-semibold mb-3 text-lg">Recording Tips</h3>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-pink-400 rounded-full mt-1.5 flex-shrink-0" />
                        <p className="text-white/70 text-sm">Record in a well-lit environment for best quality</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-pink-400 rounded-full mt-1.5 flex-shrink-0" />
                        <p className="text-white/70 text-sm">Keep your device stable for smooth video</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-pink-400 rounded-full mt-1.5 flex-shrink-0" />
                        <p className="text-white/70 text-sm">Speak clearly and naturally</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-pink-400 rounded-full mt-1.5 flex-shrink-0" />
                        <p className="text-white/70 text-sm">Maximum duration is 30 seconds</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-pink-400 rounded-full mt-1.5 flex-shrink-0" />
                        <p className="text-white/70 text-sm">Videos are automatically optimized for mobile viewing</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
