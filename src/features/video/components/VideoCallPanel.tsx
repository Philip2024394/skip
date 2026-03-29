import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Video, VideoOff, Mic, MicOff, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface VideoCallPanelProps {
  currentUserId: string;
  otherProfile: { id: string; name: string; avatar_url: string | null };
  onClose: () => void;
}

export default function VideoCallPanel({ currentUserId, otherProfile, onClose }: VideoCallPanelProps) {
  const [roomUrl, setRoomUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [incomingCall, setIncomingCall] = useState<{ callerId: string; roomUrl: string } | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // Listen for incoming calls via realtime
    const channel = supabase.channel(`user_${currentUserId}`)
      .on("broadcast", { event: "incoming-call" }, ({ payload }) => {
        setIncomingCall({ callerId: payload.callerId, roomUrl: payload.roomUrl });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentUserId]);

  useEffect(() => {
    // Initiate a call to the other person
    const initCall = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("Not authenticated");

        const { data, error: fnErr } = await supabase.functions.invoke("create-daily-room", {
          body: { recipientId: otherProfile.id },
        });

        if (fnErr) throw fnErr;
        if (data?.error) throw new Error(data.error);
        setRoomUrl(data.roomUrl);
      } catch (err: any) {
        const msg = err?.message ?? "Couldn't start call";
        if (msg.includes("not configured")) {
          setError("Video calls need setup. Ask the admin to add a Daily.co API key.");
        } else {
          setError(msg);
        }
      } finally {
        setLoading(false);
      }
    };

    initCall();
  }, [otherProfile.id]);

  const handleAcceptIncoming = () => {
    if (incomingCall) {
      setRoomUrl(incomingCall.roomUrl);
      setIncomingCall(null);
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-[60] bg-black flex flex-col"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80 backdrop-blur-sm border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <img
            src={otherProfile.avatar_url ?? "/placeholder.svg"}
            alt={otherProfile.name}
            className="w-9 h-9 rounded-full object-cover border border-white/15"
            onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
          />
          <div>
            <p className="text-white font-bold text-sm">{otherProfile.name}</p>
            <p className="text-white/40 text-[11px]">{loading ? "Connecting…" : roomUrl ? "Connected" : "Call ended"}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center"
        >
          <Phone className="w-4 h-4 text-red-400 rotate-[135deg]" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 relative">

        {/* Incoming call prompt */}
        <AnimatePresence>
          {incomingCall && (
            <motion.div
              initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="absolute top-4 inset-x-4 z-10 bg-[#1a1a1a] border border-green-500/40 rounded-2xl p-4 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 animate-pulse">
                <Video className="w-5 h-5 text-green-400" />
              </div>
              <div className="flex-1">
                <p className="text-white font-bold text-sm">Incoming video call</p>
                <p className="text-white/50 text-xs">Tap Accept to join</p>
              </div>
              <button onClick={handleAcceptIncoming}
                className="px-3 py-2 rounded-xl bg-green-500 text-white text-xs font-bold">
                Accept
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading */}
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 rounded-full border-2 border-white/20 border-t-white animate-spin" />
            <p className="text-white/50 text-sm">Connecting to {otherProfile.name}…</p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/15 flex items-center justify-center">
              <VideoOff className="w-7 h-7 text-red-400" />
            </div>
            <p className="text-white font-bold text-base">Couldn't start call</p>
            <p className="text-white/50 text-sm">{error}</p>
            <button onClick={onClose}
              className="px-5 py-2.5 rounded-2xl bg-white/10 text-white text-sm font-semibold">
              Close
            </button>
          </div>
        )}

        {/* Daily.co iframe */}
        {roomUrl && !loading && (
          <iframe
            ref={iframeRef}
            src={roomUrl}
            allow="camera; microphone; fullscreen; display-capture; autoplay"
            className="w-full h-full border-0"
            title="Video call"
          />
        )}
      </div>
    </motion.div>
  );
}
