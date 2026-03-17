import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { WebRTCConnection } from "@/shared/services/webrtc";
import analyticsLogger from "@/shared/services/analytics";

interface VideoCallScreenProps {
  matchId: string;
  callId: string;
  partnerName: string;
  partnerId: string;
  isCaller: boolean;
  onEnd: () => void;
}

const CALL_DURATION_S = 15 * 60;
const WARNING_AT_S = 13 * 60;

export default function VideoCallScreen({ matchId, callId, partnerName, partnerId, isCaller, onEnd }: VideoCallScreenProps) {
  const [elapsed, setElapsed] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [showExtendPopup, setShowExtendPopup] = useState(false);
  const [extending, setExtending] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>("new");
  const [callStartTime, setCallStartTime] = useState<number | null>(null);

  const startRef = useRef(Date.now());
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const webrtcRef = useRef<WebRTCConnection | null>(null);
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    const initCall = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");
        userIdRef.current = user.id;

        const webrtc = new WebRTCConnection(matchId, user.id);
        webrtcRef.current = webrtc;

        // Log call start
        analyticsLogger.logCallStarted({
          userId: user.id,
          matchId: matchId,
          callId: callId
        });

        await webrtc.initialize(
          (remoteStream) => {
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = remoteStream;
            }
          },
          (state) => {
            setConnectionState(state);
            if (state === "connected" && !callStartTime) {
              setCallStartTime(Date.now());
              startRef.current = Date.now();
              updateCallStatus("active");
            }
          },
          () => {
            handleEndCall();
          }
        );

        const localStream = await webrtc.startCall();
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        }

        if (isCaller) {
          await webrtc.createOffer();
        }
      } catch (error: any) {
        console.error("Error initializing call:", error);

        // Log call failure
        if (userIdRef.current) {
          analyticsLogger.logCallFailed({
            userId: userIdRef.current,
            matchId: matchId,
            callId: callId,
            error: error.message || 'Unknown call initialization error'
          });
        }

        if (error.name === "NotAllowedError") {
          toast.error("Please allow camera and microphone access");
        } else if (error.name === "NotFoundError") {
          toast.error("No camera or microphone found");
        } else {
          toast.error("Failed to start call: " + error.message);
        }
        onEnd();
      }
    };

    initCall();

    return () => {
      if (webrtcRef.current) {
        webrtcRef.current.endCall();
      }
    };
  }, [matchId, isCaller]);

  useEffect(() => {
    if (!callStartTime) return;

    const id = setInterval(() => {
      const sec = Math.floor((Date.now() - startRef.current) / 1000);
      setElapsed(sec);

      if (sec >= WARNING_AT_S && !showWarning && !showExtendPopup) {
        setShowWarning(true);
      }

      if (sec >= CALL_DURATION_S && !showExtendPopup && !callEnded) {
        setShowExtendPopup(true);
        setShowWarning(false);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [callStartTime, showWarning, showExtendPopup, callEnded]);

  const updateCallStatus = async (status: string) => {
    try {
      await supabase
        .from("video_calls")
        .update({
          status,
          ...(status === "active" ? { started_at: new Date().toISOString() } : {}),
          ...(status === "ended" ? {
            ended_at: new Date().toISOString(),
            duration_seconds: elapsed
          } : {})
        })
        .eq("id", callId);
    } catch (error) {
      console.error("Error updating call status:", error);
    }
  };

  const remaining = Math.max(0, CALL_DURATION_S - elapsed);
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  // Listen for extension payment success via URL focus return
  useEffect(() => {
    const handleFocus = () => {
      // When user returns from Stripe checkout, check for extension param
      const params = new URLSearchParams(window.location.search);
      if (params.get("feature") === "video_extend" && params.get("call") === callId) {
        startRef.current = Date.now();
        setElapsed(0);
        setShowExtendPopup(false);
        setShowWarning(false);
        toast.success("Call extended! 15 more minutes added");
        // Clean URL
        window.history.replaceState({}, "", window.location.pathname);
      }
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [callId]);

  const handleExtend = useCallback(async () => {
    setExtending(true);
    try {
      const { data, error } = await supabase.functions.invoke("extend-video-call", {
        body: { callId },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
        // Don't reset timer yet — timer resets when user returns after payment
        // (handled by the focus listener above)
        toast("Checkout opened — complete payment to extend", { duration: 5000 });
      }
    } catch (err: any) {
      toast.error("Failed to extend: " + (err?.message || "Unknown error"));
    } finally {
      setExtending(false);
    }
  }, [callId]);

  const handleEndCall = useCallback(async () => {
    if (callEnded) return;
    setCallEnded(true);

    // Log call end
    if (userIdRef.current && callStartTime) {
      const duration = Math.floor((Date.now() - callStartTime) / 1000);
      analyticsLogger.logCallEnded({
        userId: userIdRef.current,
        matchId: matchId,
        callId: callId,
        duration: duration
      });
    }

    await updateCallStatus("ended");

    if (webrtcRef.current) {
      webrtcRef.current.endCall();
    }

    onEnd();
  }, [callEnded, elapsed, onEnd, callStartTime, matchId, callId]);

  const handleDeclineExtend = useCallback(() => {
    setShowExtendPopup(false);
    handleEndCall();
  }, [handleEndCall]);

  const toggleVideo = () => {
    if (webrtcRef.current) {
      const newState = !videoEnabled;
      webrtcRef.current.toggleVideo(newState);
      setVideoEnabled(newState);
    }
  };

  const toggleAudio = () => {
    if (webrtcRef.current) {
      const newState = !audioEnabled;
      webrtcRef.current.toggleAudio(newState);
      setAudioEnabled(newState);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 400,
        background: "#000",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Remote video - full screen */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className="absolute inset-0 w-full h-full object-cover bg-black"
      />

      {/* Local video - small corner */}
      <video
        ref={localVideoRef}
        autoPlay
        playsInline
        muted
        className="absolute bottom-20 right-4 w-32 h-40 rounded-2xl object-cover bg-gray-900 border-2 border-white/20 shadow-2xl"
        style={{ transform: "scaleX(-1)" }}
      />

      {/* Timer */}
      <div className="absolute top-4 left-0 right-0 flex justify-center z-10 pointer-events-none">
        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md ${remaining <= 120
              ? "bg-red-500/80 border border-red-400/60"
              : "bg-black/60 border border-white/15"
            }`}
        >
          <Clock size={14} className={remaining <= 120 ? "text-white" : "text-white/60"} />
          <span
            className={`text-sm font-bold tabular-nums ${remaining <= 120 ? "text-white" : "text-white"
              }`}
          >
            {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
          </span>
        </div>
      </div>

      {/* Connection status indicator */}
      {connectionState !== "connected" && (
        <div className="absolute top-16 left-0 right-0 flex justify-center z-10">
          <div className="bg-yellow-500/90 text-white px-4 py-2 rounded-full text-sm font-semibold">
            {connectionState === "connecting" && "Connecting..."}
            {connectionState === "new" && "Initializing..."}
            {connectionState === "failed" && "Connection failed"}
            {connectionState === "disconnected" && "Reconnecting..."}
          </div>
        </div>
      )}

      {/* Control buttons */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-4 z-10">
        <button
          onClick={toggleAudio}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${audioEnabled
              ? "bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30"
              : "bg-red-500 hover:bg-red-600"
            }`}
        >
          {audioEnabled ? (
            <Mic className="w-6 h-6 text-white" />
          ) : (
            <MicOff className="w-6 h-6 text-white" />
          )}
        </button>

        <button
          onClick={handleEndCall}
          className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-2xl transition-all"
        >
          <PhoneOff className="w-7 h-7 text-white" />
        </button>

        <button
          onClick={toggleVideo}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${videoEnabled
              ? "bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30"
              : "bg-red-500 hover:bg-red-600"
            }`}
        >
          {videoEnabled ? (
            <Video className="w-6 h-6 text-white" />
          ) : (
            <VideoOff className="w-6 h-6 text-white" />
          )}
        </button>
      </div>

      {/* Warning banner */}
      <AnimatePresence>
        {showWarning && (
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            className="absolute top-20 left-4 right-4 z-20 bg-gradient-to-r from-red-500/95 to-red-600/95 rounded-2xl p-3 flex items-center justify-center gap-2 shadow-2xl"
          >
            <Clock size={16} className="text-white" />
            <span className="text-white text-sm font-bold">2 minutes remaining</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Extend popup */}
      <AnimatePresence>
        {showExtendPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 bg-black/85 backdrop-blur-xl flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.85, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.85, y: 20 }}
              className="w-full max-w-sm bg-gradient-to-br from-purple-900/98 to-pink-900/98 border-2 border-pink-500/40 rounded-3xl p-8 text-center shadow-2xl"
            >
              <div className="text-5xl mb-3">⏱️</div>
              <h2 className="text-white text-2xl font-black mb-2">Time's Up!</h2>
              <p className="text-white/60 text-sm mb-6 leading-relaxed">
                Extend your call with {partnerName} for 15 more minutes?
              </p>

              <button
                onClick={handleExtend}
                disabled={extending}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-black text-base mb-3 shadow-xl hover:shadow-2xl transition-all disabled:opacity-70 flex items-center justify-center gap-2"
              >
                <Video size={18} />
                {extending ? "Processing..." : "Yes, extend — $0.99"}
              </button>

              <button
                onClick={handleDeclineExtend}
                className="w-full py-3 rounded-xl border border-white/10 bg-transparent text-white/50 text-sm font-semibold hover:bg-white/5 transition-all"
              >
                No thanks, end call
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
