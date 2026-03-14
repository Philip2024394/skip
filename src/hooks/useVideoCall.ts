import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { checkWebRTCSupport, requestMediaPermissions } from "@/lib/webrtc";

export interface ActiveVideoCall {
  callId: string;
  matchId: string;
  partnerId: string;
  partnerName: string;
  partnerPhoto?: string;
  isCaller: boolean;
}

export interface IncomingCall {
  callId: string;
  matchId: string;
  callerId: string;
  callerName: string;
  callerPhoto?: string;
}

export function useVideoCall(userId: string | null) {
  const [activeCall, setActiveCall] = useState<ActiveVideoCall | null>(null);
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [initiating, setInitiating] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Subscribe to incoming call notifications for this user
  useEffect(() => {
    if (!userId) return;

    const channel = supabase.channel(`user_${userId}`);
    channelRef.current = channel;

    channel
      .on("broadcast", { event: "incoming-call" }, async ({ payload }) => {
        const { callId, matchId, callerId } = payload as {
          callId: string;
          matchId: string;
          callerId: string;
        };

        // Fetch caller profile for name/photo
        const { data: callerProfile } = await supabase
          .from("profiles")
          .select("name, avatar_url")
          .eq("id", callerId)
          .single();

        setIncomingCall({
          callId,
          matchId,
          callerId,
          callerName: (callerProfile as any)?.name || "Someone",
          callerPhoto: (callerProfile as any)?.avatar_url || undefined,
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [userId]);

  // Initiate a video call to a matched user
  const initiateCall = useCallback(
    async (receiverId: string, matchId: string, receiverName: string, receiverPhoto?: string) => {
      if (!userId) {
        toast.error("Please sign in to make video calls");
        return;
      }

      // Check browser support
      const support = checkWebRTCSupport();
      if (!support.supported) {
        toast.error(support.error || "Video calls not supported");
        return;
      }

      // Check permissions
      const perms = await requestMediaPermissions();
      if (!perms.granted) {
        toast.error(perms.error || "Camera/mic access required");
        return;
      }

      setInitiating(true);
      try {
        const { data, error } = await supabase.functions.invoke("initiate-video-call", {
          body: { receiverId, matchId },
        });

        if (error) throw error;
        if (!data?.success) throw new Error(data?.error || "Failed to initiate call");

        // Start the call as caller
        setActiveCall({
          callId: data.callId,
          matchId,
          partnerId: receiverId,
          partnerName: receiverName,
          partnerPhoto: receiverPhoto,
          isCaller: true,
        });
      } catch (err: any) {
        const msg = err?.message || "Failed to start call";
        if (msg.includes("No active connection")) {
          toast.error("You need to unlock this connection first");
        } else if (msg.includes("Video calls not enabled")) {
          toast.error("Video calls aren't enabled for this connection");
        } else {
          toast.error(msg);
        }
      } finally {
        setInitiating(false);
      }
    },
    [userId]
  );

  // Accept an incoming call
  const acceptCall = useCallback(async () => {
    if (!incomingCall) return;

    // Check browser support
    const support = checkWebRTCSupport();
    if (!support.supported) {
      toast.error(support.error || "Video calls not supported");
      declineCall();
      return;
    }

    // Check permissions
    const perms = await requestMediaPermissions();
    if (!perms.granted) {
      toast.error(perms.error || "Camera/mic access required");
      declineCall();
      return;
    }

    // Update call status to active
    await supabase
      .from("video_calls")
      .update({ status: "active", started_at: new Date().toISOString() })
      .eq("id", incomingCall.callId);

    setActiveCall({
      callId: incomingCall.callId,
      matchId: incomingCall.matchId,
      partnerId: incomingCall.callerId,
      partnerName: incomingCall.callerName,
      partnerPhoto: incomingCall.callerPhoto,
      isCaller: false,
    });
    setIncomingCall(null);
  }, [incomingCall]);

  // Decline an incoming call
  const declineCall = useCallback(async () => {
    if (!incomingCall) return;

    await supabase
      .from("video_calls")
      .update({ status: "declined" })
      .eq("id", incomingCall.callId);

    setIncomingCall(null);
  }, [incomingCall]);

  // End the active call
  const endCall = useCallback(() => {
    setActiveCall(null);
  }, []);

  return {
    activeCall,
    incomingCall,
    initiating,
    initiateCall,
    acceptCall,
    declineCall,
    endCall,
  };
}
