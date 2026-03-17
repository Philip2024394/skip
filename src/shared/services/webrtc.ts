import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

const STUN_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
];

export interface WebRTCSignal {
  type: "offer" | "answer" | "ice-candidate" | "end-call";
  data?: RTCSessionDescriptionInit | RTCIceCandidateInit;
  senderId: string;
}

export class WebRTCConnection {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private channel: RealtimeChannel | null = null;
  private channelName: string;
  private userId: string;
  private onRemoteStreamCallback?: (stream: MediaStream) => void;
  private onConnectionStateChangeCallback?: (state: RTCPeerConnectionState) => void;
  private onCallEndedCallback?: () => void;

  constructor(matchId: string, userId: string) {
    this.channelName = `video_call_${matchId}`;
    this.userId = userId;
  }

  async initialize(
    onRemoteStream: (stream: MediaStream) => void,
    onConnectionStateChange: (state: RTCPeerConnectionState) => void,
    onCallEnded: () => void
  ) {
    this.onRemoteStreamCallback = onRemoteStream;
    this.onConnectionStateChangeCallback = onConnectionStateChange;
    this.onCallEndedCallback = onCallEnded;

    // Create peer connection
    this.peerConnection = new RTCPeerConnection({
      iceServers: STUN_SERVERS,
    });

    // Setup remote stream
    this.remoteStream = new MediaStream();
    this.peerConnection.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        this.remoteStream?.addTrack(track);
      });
      if (this.onRemoteStreamCallback) {
        this.onRemoteStreamCallback(this.remoteStream);
      }
    };

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignal({
          type: "ice-candidate",
          data: event.candidate.toJSON(),
          senderId: this.userId,
        });
      }
    };

    // Monitor connection state
    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection?.connectionState;
      if (state && this.onConnectionStateChangeCallback) {
        this.onConnectionStateChangeCallback(state);
      }
      if (state === "failed" || state === "disconnected" || state === "closed") {
        this.cleanup();
      }
    };

    // Setup Supabase Realtime channel for signaling
    this.channel = supabase.channel(this.channelName);

    this.channel
      .on("broadcast", { event: "webrtc-signal" }, async ({ payload }) => {
        await this.handleSignal(payload as WebRTCSignal);
      })
      .subscribe();
  }

  async startCall() {
    try {
      // Get local media stream
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: { echoCancellation: true, noiseSuppression: true },
      });

      // Add tracks to peer connection
      this.localStream.getTracks().forEach((track) => {
        if (this.peerConnection && this.localStream) {
          this.peerConnection.addTrack(track, this.localStream);
        }
      });

      return this.localStream;
    } catch (error) {
      console.error("Error accessing media devices:", error);
      throw error;
    }
  }

  async createOffer() {
    if (!this.peerConnection) throw new Error("Peer connection not initialized");

    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);

    this.sendSignal({
      type: "offer",
      data: offer,
      senderId: this.userId,
    });
  }

  async handleOffer(offer: RTCSessionDescriptionInit) {
    if (!this.peerConnection) throw new Error("Peer connection not initialized");

    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);

    this.sendSignal({
      type: "answer",
      data: answer,
      senderId: this.userId,
    });
  }

  async handleAnswer(answer: RTCSessionDescriptionInit) {
    if (!this.peerConnection) throw new Error("Peer connection not initialized");
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
  }

  async handleIceCandidate(candidate: RTCIceCandidateInit) {
    if (!this.peerConnection) throw new Error("Peer connection not initialized");
    await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  }

  private async handleSignal(signal: WebRTCSignal) {
    // Ignore own signals
    if (signal.senderId === this.userId) return;

    try {
      switch (signal.type) {
        case "offer":
          if (signal.data) {
            await this.handleOffer(signal.data as RTCSessionDescriptionInit);
          }
          break;
        case "answer":
          if (signal.data) {
            await this.handleAnswer(signal.data as RTCSessionDescriptionInit);
          }
          break;
        case "ice-candidate":
          if (signal.data) {
            await this.handleIceCandidate(signal.data as RTCIceCandidateInit);
          }
          break;
        case "end-call":
          if (this.onCallEndedCallback) {
            this.onCallEndedCallback();
          }
          this.cleanup();
          break;
      }
    } catch (error) {
      console.error("Error handling signal:", error);
    }
  }

  private sendSignal(signal: WebRTCSignal) {
    if (!this.channel) return;
    this.channel.send({
      type: "broadcast",
      event: "webrtc-signal",
      payload: signal,
    });
  }

  toggleVideo(enabled: boolean) {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach((track) => {
        track.enabled = enabled;
      });
    }
  }

  toggleAudio(enabled: boolean) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = enabled;
      });
    }
  }

  endCall() {
    this.sendSignal({
      type: "end-call",
      senderId: this.userId,
    });
    this.cleanup();
  }

  private cleanup() {
    // Stop all tracks
    this.localStream?.getTracks().forEach((track) => track.stop());
    this.remoteStream?.getTracks().forEach((track) => track.stop());

    // Close peer connection
    this.peerConnection?.close();

    // Unsubscribe from channel
    if (this.channel) {
      supabase.removeChannel(this.channel);
    }

    this.localStream = null;
    this.remoteStream = null;
    this.peerConnection = null;
    this.channel = null;
  }

  getLocalStream() {
    return this.localStream;
  }

  getRemoteStream() {
    return this.remoteStream;
  }
}

export function checkWebRTCSupport(): { supported: boolean; error?: string } {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return {
      supported: false,
      error: "Your browser doesn't support video calls. Please use a modern browser like Chrome, Firefox, or Safari.",
    };
  }

  if (!window.RTCPeerConnection) {
    return {
      supported: false,
      error: "Your browser doesn't support WebRTC. Please update your browser.",
    };
  }

  return { supported: true };
}

export async function requestMediaPermissions(): Promise<{ granted: boolean; error?: string }> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    stream.getTracks().forEach((track) => track.stop());
    return { granted: true };
  } catch (error: any) {
    if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
      return {
        granted: false,
        error: "Please allow camera and microphone access to make video calls.",
      };
    } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
      return {
        granted: false,
        error: "No camera or microphone found. Please connect a camera and microphone.",
      };
    }
    return {
      granted: false,
      error: "Could not access camera and microphone. Please check your device settings.",
    };
  }
}
