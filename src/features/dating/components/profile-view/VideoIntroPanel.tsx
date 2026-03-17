import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Play, Pause, Volume2, VolumeX, Video } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Profile {
  id: string;
  name?: string;
  avatar_url?: string;
  image?: string;
  video_url?: string;
  city?: string;
  age?: number;
  gender?: string;
}

interface VideoIntroPanelProps {
  profile: Profile;
  currentUserId?: string;
  currentUserName?: string;
  onClose: () => void;
  onMatch?: (matchedName: string, matchedId: string) => void;
}

const BRAND = "Date2me.com";

// ── Fallback videos ────────────────────────────────────────────────────────────
const DEMO_VIDEOS = [
  "https://ik.imagekit.io/7grri5v7d/do.mp4",
];

function getDemoVideo(profileId: string) {
  const idx = Math.abs([...profileId].reduce((s, c) => s + c.charCodeAt(0), 0)) % DEMO_VIDEOS.length;
  return DEMO_VIDEOS[idx];
}

// ── Video panel background images ─────────────────────────────────────────────
// Female profiles use the warm room image; male profiles rotate through 3 others.
// Hash on profile ID so each profile always gets the same background.
const BG_FEMALE = [
  "https://ik.imagekit.io/7grri5v7d/room%20323.png",
];
const BG_MALE = [
  "https://ik.imagekit.io/7grri5v7d/sddasdasdasda.png",
  "https://ik.imagekit.io/7grri5v7d/soccer.png",
  "https://ik.imagekit.io/7grri5v7d/guys%204ewrfsdfsd.png",
  "https://ik.imagekit.io/7grri5v7d/guys%204ewr.png",
];

function getVideoBg(profile: Profile): string {
  if (profile.gender?.toLowerCase() === "female") {
    return BG_FEMALE[0];
  }
  // Male: random on every render so it changes on refresh
  return BG_MALE[Math.floor(Math.random() * BG_MALE.length)];
}

export default function VideoIntroPanel({
  profile,
  currentUserId,
  currentUserName = "You",
  onClose,
  onMatch,
}: VideoIntroPanelProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [likeProcessing, setLikeProcessing] = useState(false);
  const [showLikeFlash, setShowLikeFlash] = useState(false);

  const videoSrc = profile.video_url || getDemoVideo(profile.id);
  const profileName = profile.name || "Profile";

  // ── Load existing like state and count ───────────────────────────────────────
  useEffect(() => {
    if (!currentUserId || !profile.id) return;

    const loadLikes = async () => {
      // Count likes
      try {
        const { data: likeRows } = await (supabase as any)
          .from("video_likes")
          .select("id", { count: "exact" })
          .eq("video_owner_id", profile.id);
        if (likeRows) setLikeCount(Array.isArray(likeRows) ? likeRows.length : 0);
      } catch {
        // fallback: localStorage
        const local: any[] = JSON.parse(localStorage.getItem("video_likes_demo") || "[]");
        setLikeCount(local.filter((l) => l.video_owner_id === profile.id).length);
      }

      // Check if current user already liked
      try {
        const { data } = await (supabase as any)
          .from("video_likes")
          .select("id")
          .eq("video_owner_id", profile.id)
          .eq("liker_id", currentUserId)
          .maybeSingle();
        if (data) setLiked(true);
      } catch {
        const local: any[] = JSON.parse(localStorage.getItem("video_likes_demo") || "[]");
        if (local.some((l) => l.video_owner_id === profile.id && l.liker_id === currentUserId)) {
          setLiked(true);
        }
      }
    };

    loadLikes();
  }, [profile.id, currentUserId]);

  // ── Video controls ────────────────────────────────────────────────────────────
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (playing) { videoRef.current.pause(); setPlaying(false); }
    else { videoRef.current.play(); setPlaying(true); }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !muted;
    setMuted((m) => !m);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setProgress(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    const d = Math.min(videoRef.current.duration, 30);
    setDuration(d);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const t = parseFloat(e.target.value);
    videoRef.current.currentTime = t;
    setProgress(t);
  };

  // Enforce 30s cap
  useEffect(() => {
    if (!videoRef.current) return;
    const onTime = () => {
      if (videoRef.current && videoRef.current.currentTime >= 30) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
        setPlaying(false);
        setProgress(0);
      }
    };
    const v = videoRef.current;
    v.addEventListener("timeupdate", onTime);
    return () => v.removeEventListener("timeupdate", onTime);
  }, []);

  // ── Like action ──────────────────────────────────────────────────────────────
  const handleLike = async () => {
    if (liked || likeProcessing || !currentUserId) return;
    setLikeProcessing(true);

    try {
      // Record the video like
      let savedToSupabase = false;
      try {
        const { error } = await (supabase as any).from("video_likes").insert({
          video_owner_id: profile.id,
          liker_id: currentUserId,
          liker_name: currentUserName,
          created_at: new Date().toISOString(),
        });
        if (!error) savedToSupabase = true;
      } catch {
        // fallback
      }

      if (!savedToSupabase) {
        const local: any[] = JSON.parse(localStorage.getItem("video_likes_demo") || "[]");
        local.push({
          id: `vl_${Date.now()}`,
          video_owner_id: profile.id,
          liker_id: currentUserId,
          liker_name: currentUserName,
          created_at: new Date().toISOString(),
        });
        localStorage.setItem("video_likes_demo", JSON.stringify(local));
      }

      // Send notification to video owner
      try {
        await (supabase as any).from("notifications").insert({
          user_id: profile.id,
          type: "video_like",
          from_user_id: currentUserId,
          from_user_name: currentUserName,
          message: `${currentUserName} liked your video introduction!`,
          read: false,
          created_at: new Date().toISOString(),
        });
      } catch {
        // Store in localStorage for demo
        const notifs: any[] = JSON.parse(localStorage.getItem("video_like_notifications") || "[]");
        notifs.push({
          id: `vn_${Date.now()}`,
          user_id: profile.id,
          liker_id: currentUserId,
          liker_name: currentUserName,
          created_at: new Date().toISOString(),
        });
        localStorage.setItem("video_like_notifications", JSON.stringify(notifs));
      }

      // Also record as a profile like (for match detection)
      try {
        await (supabase as any).from("likes").insert({
          liker_id: currentUserId,
          liked_id: profile.id,
          created_at: new Date().toISOString(),
        });
      } catch {
        // ignore duplicate / error
      }

      // Check for mutual like → match
      let isMatch = false;
      try {
        const { data: mutual } = await supabase
          .from("likes")
          .select("id")
          .eq("liker_id", profile.id)
          .eq("liked_id", currentUserId)
          .maybeSingle();
        if (mutual) isMatch = true;
      } catch {
        const localLikes: any[] = JSON.parse(localStorage.getItem("demo_likes") || "[]");
        isMatch = localLikes.some((l) => l.liker_id === profile.id && l.liked_id === currentUserId);
      }

      setLiked(true);
      setLikeCount((c) => c + 1);
      setShowLikeFlash(true);
      setTimeout(() => setShowLikeFlash(false), 900);

      if (isMatch && onMatch) {
        onMatch(profileName, profile.id);
      } else {
        toast.success(`You liked ${profileName}'s intro video!`);
      }
    } catch (err) {
      console.error("Error liking video:", err);
    } finally {
      setLikeProcessing(false);
    }
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.22 }}
      className="relative rounded-2xl overflow-hidden min-h-0 flex flex-col shadow-[0_8px_32px_rgba(0,0,0,0.4),0_2px_8px_rgba(0,0,0,0.3)]"
      style={{ backgroundImage: `url(${getVideoBg(profile)})`, backgroundSize: "contain", backgroundPosition: "center bottom", backgroundRepeat: "no-repeat", backgroundColor: "#0a0010" }}
    >
      {/* Overlay — matches profile panel: light fuchsia/purple diagonal, no heavy darking */}
      <div className="absolute inset-0 pointer-events-none z-0" style={{
        background: "linear-gradient(135deg, rgba(112,26,117,0.30) 0%, rgba(0,0,0,0.18) 50%, rgba(88,28,135,0.28) 100%)",
      }} />

      {/* Header — avatar taps back to profile */}
      <button
        onClick={onClose}
        className="relative z-10 flex items-center gap-3 px-4 pt-4 pb-2 flex-shrink-0 text-left hover:opacity-80 transition-opacity"
      >
        <div className="w-14 h-14 rounded-full overflow-hidden border-2 flex-shrink-0"
          style={{ borderColor: "rgba(244,63,94,0.6)", boxShadow: "0 0 14px rgba(244,63,94,0.35)" }}>
          <img
            src={profile.avatar_url || profile.image || "/placeholder.svg"}
            alt={profileName}
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <p className="text-white font-bold text-xl leading-tight">
            {profileName}
          </p>
          <p className="text-white/45 text-[11px] mt-0.5">30-second intro video</p>
        </div>
      </button>

      {/* ── Video Player ─────────────────────────────────────────────────────── */}
      <div className="relative z-10 mx-3 rounded-2xl overflow-hidden flex-shrink-0"
        style={{ aspectRatio: "9/16", maxHeight: "52vh", background: "#000" }}>

        <video
          ref={videoRef}
          src={videoSrc}
          className="w-full h-full object-cover"
          playsInline
          preload="metadata"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => { setPlaying(false); setProgress(0); }}
        />

        {/* Brand logo watermark — top-right */}
        <div className="absolute top-3 right-3 z-10"
          style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.7))" }}>
          <img
            src="https://ik.imagekit.io/7grri5v7d/sdasdgdsfgsdfg-removebg-preview.png"
            alt={BRAND}
            className="w-12 h-12 object-contain opacity-90"
          />
        </div>

        {/* Play/Pause overlay */}
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center z-10"
        >
          <AnimatePresence>
            {!playing && (
              <motion.div
                key="play"
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.7, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{ background: "rgba(0,0,0,0.60)", border: "2px solid rgba(255,255,255,0.35)" }}
              >
                <Play className="w-6 h-6 text-white fill-white ml-0.5" />
              </motion.div>
            )}
          </AnimatePresence>
        </button>

        {/* Controls bar */}
        <div className="absolute bottom-0 left-0 right-0 z-10 px-3 pb-2 pt-6"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)" }}>
          <div className="flex items-center gap-2">
            <button onClick={togglePlay} className="text-white/90 hover:text-white">
              {playing
                ? <Pause className="w-4 h-4 fill-white" />
                : <Play className="w-4 h-4 fill-white ml-0.5" />}
            </button>
            <span className="text-white/60 text-[10px] w-8 flex-shrink-0">{fmt(progress)}</span>
            <input
              type="range"
              min={0}
              max={duration || 30}
              step={0.1}
              value={progress}
              onChange={handleSeek}
              className="flex-1 h-1 accent-rose-500 cursor-pointer"
            />
            <span className="text-white/40 text-[10px] w-8 flex-shrink-0 text-right">{fmt(duration || 30)}</span>
            <button onClick={toggleMute} className="text-white/70 hover:text-white">
              {muted
                ? <VolumeX className="w-4 h-4" />
                : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* No video notice — above like buttons so it's always visible */}
      {!profile.video_url && (
        <div className="relative z-10 mx-3 mt-2 rounded-xl px-3 py-2.5 flex items-center gap-2 flex-shrink-0"
          style={{ background: "rgba(251,113,133,0.13)", border: "1px solid rgba(251,113,133,0.30)" }}>
          <Video className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <p className="text-white/70 text-[11px] font-medium">{profileName} Has Not Uploaded Their Intro Video Yet</p>
        </div>
      )}

      {/* ── Like section ─────────────────────────────────────────────────────── */}
      <div className="relative z-10 flex items-center gap-3 px-5 py-3 flex-shrink-0">
        {/* Like button */}
        <button
          onClick={handleLike}
          disabled={liked || likeProcessing || !currentUserId}
          className="relative flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-all disabled:opacity-60"
          style={{ background: liked ? "linear-gradient(135deg, #be123c, #f43f5e)" : "linear-gradient(135deg, #e11d48, #f43f5e)", color: "#fff", boxShadow: "0 4px 20px rgba(244,63,94,0.50)" }}
        >
          <Heart className="w-4 h-4 fill-white" />
          {liked ? "Liked!" : "Like"}

          {/* Flash animation on like */}
          <AnimatePresence>
            {showLikeFlash && (
              <motion.div
                className="absolute inset-0 rounded-full"
                initial={{ scale: 1, opacity: 0.7 }}
                animate={{ scale: 2.2, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                style={{ background: "radial-gradient(circle, rgba(244,63,94,0.6) 0%, transparent 70%)" }}
              />
            )}
          </AnimatePresence>
        </button>

        {/* Like count */}
        <div className="flex items-center gap-1.5">
          <Heart className="w-4 h-4 text-rose-400 fill-rose-400" />
          <span className="text-white text-base font-bold">{likeCount.toLocaleString()}</span>
          <span className="text-white/50 text-xs font-semibold">likes</span>
        </div>
      </div>
    </motion.div>
  );
}
