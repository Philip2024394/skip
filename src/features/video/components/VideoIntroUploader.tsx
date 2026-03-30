import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Video, Square, Play, Trash2, Loader2, Upload, Check, Camera } from "lucide-react";
import { Button } from "@/shared/components/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface VideoIntroUploaderProps {
  videoUrl: string | null;
  userId: string;
  onSaved: (url: string | null) => void;
}

const MAX_DURATION = 30;

export default function VideoIntroUploader({ videoUrl, userId, onSaved }: VideoIntroUploaderProps) {
  const [mode, setMode] = useState<"idle" | "recording" | "preview" | "uploading">("idle");
  const [elapsed, setElapsed] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (stream) stream.getTracks().forEach((t) => t.stop());
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startRecording = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 1280 } },
        audio: true,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }

      // Try webm, fall back to mp4
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
        ? "video/webm;codecs=vp8,opus"
        : "video/mp4";
      const mr = new MediaRecorder(mediaStream, { mimeType });
      mediaRecorderRef.current = mr;
      chunksRef.current = [];

      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setRecordedBlob(blob);
        setPreviewUrl(url);
        setMode("preview");
        mediaStream.getTracks().forEach((t) => t.stop());
        setStream(null);
      };

      mr.start(200);
      setElapsed(0);
      setMode("recording");

      timerRef.current = setInterval(() => {
        setElapsed((prev) => {
          if (prev + 1 >= MAX_DURATION) {
            stopRecording();
            return MAX_DURATION;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error(err);
      toast.error("Could not access camera. Check permissions and try again.");
    }
  };

  const stopRecording = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  };

  const discard = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setRecordedBlob(null);
    setPreviewUrl(null);
    setElapsed(0);
    setMode("idle");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) { toast.error("Please select a video file."); return; }
    if (file.size > 50 * 1024 * 1024) { toast.error("Video must be under 50 MB."); return; }
    const url = URL.createObjectURL(file);
    setRecordedBlob(file);
    setPreviewUrl(url);
    setMode("preview");
    e.target.value = "";
  };

  const saveVideo = async () => {
    if (!recordedBlob) return;
    setMode("uploading");
    try {
      const ext = recordedBlob.type.includes("mp4") ? "mp4" : "webm";
      const path = `${userId}/video_intro_${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, recordedBlob, {
        contentType: recordedBlob.type,
        upsert: true,
      });
      if (upErr) throw upErr;

      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = urlData.publicUrl;

      const { error: dbErr } = await (supabase as any)
        .from("profiles")
        .update({ video_url: publicUrl })
        .eq("id", userId);
      if (dbErr) throw dbErr;

      onSaved(publicUrl);
      toast.success("Video intro saved!");
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      setRecordedBlob(null);
      setMode("idle");
    } catch (err) {
      console.error(err);
      toast.error("Upload failed. Try again.");
      setMode("preview");
    }
  };

  const deleteVideo = async () => {
    if (!window.confirm("Remove your intro video?")) return;
    try {
      await (supabase as any).from("profiles").update({ video_url: null }).eq("id", userId);
      onSaved(null);
      toast.success("Video intro removed.");
    } catch {
      toast.error("Could not remove video.");
    }
  };

  const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: "linear-gradient(135deg,#7c3aed,#db2777)" }}>
          <Video className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm">Intro Video <span className="text-white/40 font-normal text-xs">(max 30s)</span></p>
          <p className="text-white/40 text-[11px]">Record or upload a short video introduction</p>
        </div>
        {videoUrl && mode === "idle" && (
          <button onClick={deleteVideo} className="text-white/30 hover:text-rose-400 transition-colors p-1">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Body */}
      <div className="px-4 pb-4 space-y-3">

        {/* Existing video */}
        {videoUrl && mode === "idle" && (
          <div className="rounded-xl overflow-hidden bg-black" style={{ aspectRatio: "9/16", maxHeight: 240 }}>
            <video src={videoUrl} className="w-full h-full object-cover" controls playsInline />
          </div>
        )}

        {/* Recording view */}
        {mode === "recording" && (
          <div className="relative rounded-xl overflow-hidden bg-black" style={{ aspectRatio: "9/16", maxHeight: 320 }}>
            <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
            {/* REC indicator */}
            <div className="absolute top-3 left-3 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-white text-xs font-bold">REC</span>
            </div>
            {/* Timer */}
            <div className="absolute top-3 right-3 bg-black/60 rounded-lg px-2.5 py-1">
              <span className="text-white text-xs font-mono">{fmtTime(elapsed)} / {fmtTime(MAX_DURATION)}</span>
            </div>
            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
              <motion.div
                className="h-full bg-rose-500"
                style={{ width: `${(elapsed / MAX_DURATION) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Preview */}
        {mode === "preview" && previewUrl && (
          <div className="rounded-xl overflow-hidden bg-black" style={{ aspectRatio: "9/16", maxHeight: 320 }}>
            <video src={previewUrl} className="w-full h-full object-cover" controls playsInline />
          </div>
        )}

        {/* Controls */}
        {mode === "idle" && (
          <div className="flex gap-2">
            <button
              onClick={startRecording}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-95"
              style={{ background: "linear-gradient(135deg,#7c3aed,#db2777)" }}
            >
              <Camera className="w-4 h-4" />
              {videoUrl ? "Re-record" : "Record"}
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white/70 transition-all active:scale-95"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}
            >
              <Upload className="w-4 h-4" />
              Upload
            </button>
            <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={handleFileUpload} />
          </div>
        )}

        {mode === "recording" && (
          <button
            onClick={stopRecording}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-95"
            style={{ background: "rgba(239,68,68,0.85)" }}
          >
            <Square className="w-4 h-4 fill-white" />
            Stop Recording
          </button>
        )}

        {mode === "preview" && (
          <div className="flex gap-2">
            <button
              onClick={discard}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white/60 transition-all active:scale-95"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}
            >
              <Trash2 className="w-4 h-4" />
              Discard
            </button>
            <button
              onClick={saveVideo}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-95"
              style={{ background: "linear-gradient(135deg,#7c3aed,#db2777)" }}
            >
              <Check className="w-4 h-4" />
              Save Video
            </button>
          </div>
        )}

        {mode === "uploading" && (
          <div className="flex items-center justify-center gap-2 py-3 text-white/60 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Uploading video…
          </div>
        )}

        {/* Hidden video element used during recording for live preview */}
        {mode !== "recording" && <video ref={videoRef} className="hidden" muted playsInline />}
      </div>
    </div>
  );
}
