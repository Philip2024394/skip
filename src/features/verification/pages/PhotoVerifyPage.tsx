import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Camera, RotateCcw, Check, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Step = "intro" | "camera" | "preview" | "submitted";

interface PhotoVerifyPageProps {
  userId: string;
  onVerified: () => void;
  onClose: () => void;
}

export default function PhotoVerifyPage({ userId, onVerified, onClose }: PhotoVerifyPageProps) {
  const [step, setStep] = useState<Step>("intro");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(async () => {
    stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 720 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch {
      toast.error("Couldn't access camera. Please allow camera permission.");
      setStep("intro");
    }
  }, [facingMode, stopCamera]);

  useEffect(() => {
    if (step === "camera") startCamera();
    else stopCamera();
    return () => stopCamera();
  }, [step, facingMode, startCamera, stopCamera]);

  const handleCapture = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    const size = Math.min(videoRef.current.videoWidth, videoRef.current.videoHeight);
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const xOffset = (videoRef.current.videoWidth - size) / 2;
    const yOffset = (videoRef.current.videoHeight - size) / 2;
    ctx.drawImage(videoRef.current, xOffset, yOffset, size, size, 0, 0, size, size);
    setCapturedImage(canvas.toDataURL("image/jpeg", 0.85));
    stopCamera();
    setStep("preview");
  };

  const handleSubmit = async () => {
    if (!capturedImage) return;
    setUploading(true);
    try {
      // Convert data URL to blob
      const res = await fetch(capturedImage);
      const blob = await res.blob();
      const path = `selfies/${userId}/${Date.now()}.jpg`;

      const { error: uploadErr } = await supabase.storage
        .from("verification-selfies")
        .upload(path, blob, { contentType: "image/jpeg", upsert: true });
      if (uploadErr) throw uploadErr;

      const { data: { publicUrl } } = supabase.storage.from("verification-selfies").getPublicUrl(path);

      // ── Immediately grant photo-verified badge (free tier) ──────────────────
      // ID-doc verification ($4.99) is a separate paid tier handled in DashboardPage.
      await Promise.all([
        // Mark profile as photo-verified
        supabase.from("profiles").update({
          is_verified: true,
          photo_verified: true,
          verification_status: "approved",
          verification_photo_url: publicUrl,
        } as any).eq("id", userId),
        // Award 50 coins for completing verification
        (supabase.rpc as any)("award_coins", {
          p_user_id: userId,
          p_amount: 50,
          p_reason: "photo_verification_complete",
        }),
        // Log selfie record
        (supabase.from("verification_selfies" as any).insert as any)({
          user_id: userId,
          selfie_url: publicUrl,
          status: "auto_approved",
        }),
      ]);

      setStep("submitted");
      toast.success("✅ Verified! +50 coins earned", {
        description: "Your profile now shows the verified badge",
        duration: 5000,
      });
      setTimeout(() => onVerified(), 1800);
    } catch (err: any) {
      toast.error(err?.message ?? "Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0a0a] flex flex-col"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/8">
        <button onClick={() => { stopCamera(); onClose(); }}
          className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center">
          <X className="w-4 h-4 text-white/60" />
        </button>
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-green-400" />
          <span className="font-display font-bold text-white text-sm">Photo Verification</span>
        </div>
        <div className="w-8" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <AnimatePresence mode="wait">

          {/* ── INTRO ── */}
          {step === "intro" && (
            <motion.div key="intro" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center gap-6 text-center max-w-xs">
              <div className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, rgba(34,197,94,0.2), rgba(16,185,129,0.15))", border: "2px solid rgba(34,197,94,0.3)" }}>
                <Camera className="w-9 h-9 text-green-400" />
              </div>
              <div>
                <h2 className="font-display font-bold text-white text-xl mb-2">Verify Your Photo</h2>
                <p className="text-white/50 text-sm leading-relaxed">
                  Take a selfie to earn a <strong className="text-green-400">✅ Verified</strong> badge on your profile. It shows matches you're a real person.
                </p>
              </div>
              <div className="w-full space-y-2 text-left">
                {["Make sure your face is clearly visible", "Good lighting works best", "No sunglasses or masks", "Our team reviews within 24 hours"].map((tip, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <Check className="w-2.5 h-2.5 text-green-400" />
                    </div>
                    <p className="text-white/60 text-xs">{tip}</p>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setStep("camera")}
                className="w-full py-3.5 rounded-2xl text-white font-bold text-sm"
                style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}
              >
                Open Camera
              </button>
            </motion.div>
          )}

          {/* ── CAMERA ── */}
          {step === "camera" && (
            <motion.div key="camera" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 w-full max-w-xs">
              <div className="relative w-full aspect-square rounded-3xl overflow-hidden bg-black border-2 border-white/10">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{ transform: facingMode === "user" ? "scaleX(-1)" : "none" }}
                />
                {/* Face guide oval */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-56 rounded-full border-2 border-white/40"
                    style={{ boxShadow: "0 0 0 9999px rgba(0,0,0,0.45)" }} />
                </div>
                {/* Flip camera */}
                <button
                  onClick={() => setFacingMode(f => f === "user" ? "environment" : "user")}
                  className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 flex items-center justify-center"
                >
                  <RotateCcw className="w-4 h-4 text-white" />
                </button>
              </div>
              <p className="text-white/40 text-xs text-center">Centre your face in the oval</p>
              <button
                onClick={handleCapture}
                className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.15)" }}
              >
                <div className="w-12 h-12 rounded-full bg-white" />
              </button>
            </motion.div>
          )}

          {/* ── PREVIEW ── */}
          {step === "preview" && capturedImage && (
            <motion.div key="preview" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-5 w-full max-w-xs">
              <img src={capturedImage} alt="Your selfie"
                className="w-full aspect-square rounded-3xl object-cover border-2 border-white/10"
                style={{ transform: "scaleX(-1)" }} />
              <p className="text-white/60 text-sm text-center">Looking good? Submit for review, or retake.</p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => { setCapturedImage(null); setStep("camera"); }}
                  className="flex-1 py-3 rounded-2xl border border-white/15 text-white/70 font-semibold text-sm flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" /> Retake
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={uploading}
                  className="flex-1 py-3 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}
                >
                  {uploading
                    ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    : <><Check className="w-4 h-4" /> Submit</>
                  }
                </button>
              </div>
            </motion.div>
          )}

          {/* ── SUBMITTED ── */}
          {step === "submitted" && (
            <motion.div key="submitted" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-5 text-center max-w-xs">
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center border-2 border-green-500/40"
              >
                <Check className="w-9 h-9 text-green-400" />
              </motion.div>
              <div>
                <h2 className="font-display font-bold text-white text-xl mb-2">Selfie Submitted!</h2>
                <p className="text-white/50 text-sm leading-relaxed">
                  Our team will review your photo within <strong className="text-white/80">24 hours</strong>. You'll get a <strong className="text-green-400">✅ Verified</strong> badge once approved.
                </p>
              </div>
              <button onClick={onClose}
                className="w-full py-3.5 rounded-2xl text-white font-bold text-sm"
                style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}>
                Done
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
