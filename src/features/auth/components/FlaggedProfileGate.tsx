import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Camera, Upload, CheckCircle2, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FlaggedProfileGateProps {
  userId: string;
  flagReason?: string | null;
  onCleared: () => void;
}

type Step = "message" | "photo" | "video" | "pending";

export default function FlaggedProfileGate({ userId, flagReason, onCleared }: FlaggedProfileGateProps) {
  const [step, setStep] = useState<Step>("message");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const url = URL.createObjectURL(file);
    setPhotoPreview(url);
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoFile(file);
    const url = URL.createObjectURL(file);
    setVideoPreview(url);
  };

  const handleSubmit = async () => {
    if (!photoFile) { toast.error("Please upload a clear photo of yourself."); return; }
    if (!videoFile) { toast.error("Please record a short video selfie."); return; }
    setUploading(true);
    try {
      // Upload photo
      const photoExt = photoFile.name.split(".").pop() || "jpg";
      const photoPath = `flag-appeal/${userId}/photo_${Date.now()}.${photoExt}`;
      const { error: photoErr } = await supabase.storage.from("avatars").upload(photoPath, photoFile, { upsert: true });
      if (photoErr) throw photoErr;
      const { data: photoUrlData } = supabase.storage.from("avatars").getPublicUrl(photoPath);

      // Upload video selfie
      const videoExt = videoFile.name.split(".").pop() || "mp4";
      const videoPath = `flag-appeal/${userId}/selfie_${Date.now()}.${videoExt}`;
      const { error: videoErr } = await supabase.storage.from("avatars").upload(videoPath, videoFile, { upsert: true });
      if (videoErr) throw videoErr;
      const { data: videoUrlData } = supabase.storage.from("avatars").getPublicUrl(videoPath);

      // Update profile with new photo + mark as pending review (not yet cleared)
      await (supabase.from("profiles").update as any)({
        avatar_url: photoUrlData.publicUrl,
        photo_flagged: false,          // clear the flag — admin will re-check
        flag_reason: null,
        flag_reviewed_at: new Date().toISOString(),
      }).eq("id", userId);

      // Insert selfie record for admin review
      await (supabase as any).from("verification_selfies").insert({
        user_id: userId,
        selfie_url: videoUrlData.publicUrl,
        status: "pending",
      });

      setStep("pending");
      // Give the update time to commit before navigating
      setTimeout(onCleared, 2200);
    } catch (err: any) {
      toast.error(err?.message ?? "Upload failed — please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "#0c0c14",
      display: "flex", flexDirection: "column", alignItems: "center",
      fontFamily: "inherit", overflowY: "auto",
    }}>
      {/* Top accent */}
      <motion.div
        style={{ width: "100%", height: 3, background: "linear-gradient(90deg,#f59e0b,#ef4444,#f59e0b)", backgroundSize: "200%" }}
        animate={{ backgroundPosition: ["0%", "100%", "0%"] }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      />

      <div style={{ width: "100%", maxWidth: 400, padding: "32px 24px 40px", flex: 1, display: "flex", flexDirection: "column", gap: 0 }}>

        <AnimatePresence mode="wait">

          {/* ── STEP 1: Flag message ── */}
          {step === "message" && (
            <motion.div key="message"
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }}
              style={{ display: "flex", flexDirection: "column", gap: 24 }}
            >
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, paddingTop: 16 }}>
                <motion.div
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                  style={{
                    width: 72, height: 72, borderRadius: "50%",
                    background: "rgba(239,68,68,0.12)",
                    border: "2px solid rgba(239,68,68,0.35)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <AlertTriangle style={{ width: 32, height: 32, color: "#ef4444" }} />
                </motion.div>
                <p style={{ color: "#ef4444", fontWeight: 900, fontSize: 20, margin: 0, textAlign: "center" }}>
                  Profile Flagged
                </p>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, margin: 0, textAlign: "center", lineHeight: 1.6 }}>
                  Your profile has been flagged by our safety team because your photo does not appear to show a real person.
                </p>
                {flagReason && (
                  <div style={{
                    background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                    borderRadius: 12, padding: "10px 14px", width: "100%",
                  }}>
                    <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                      Reason
                    </p>
                    <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, margin: 0, lineHeight: 1.5 }}>{flagReason}</p>
                  </div>
                )}
              </div>

              <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "16px" }}>
                <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 14, fontWeight: 700, margin: "0 0 10px" }}>
                  To restore access you need to:
                </p>
                {[
                  { icon: "📸", text: "Upload a clear, recent photo of your real face" },
                  { icon: "🎬", text: "Record a short 3–5 second video selfie (e.g. wave at the camera)" },
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderTop: i > 0 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                    <span style={{ fontSize: 20 }}>{item.icon}</span>
                    <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, margin: 0, lineHeight: 1.4 }}>{item.text}</p>
                  </div>
                ))}
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }} whileHover={{ scale: 1.01 }}
                onClick={() => setStep("photo")}
                style={{
                  width: "100%", height: 52, borderRadius: 16, border: "none",
                  background: "linear-gradient(135deg,#ec4899,#a855f7)",
                  color: "white", fontWeight: 800, fontSize: 15,
                  boxShadow: "0 4px 20px rgba(236,72,153,0.38)",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  cursor: "pointer",
                }}
              >
                Start Verification <ArrowRight style={{ width: 18, height: 18 }} />
              </motion.button>
            </motion.div>
          )}

          {/* ── STEP 2: Photo upload ── */}
          {step === "photo" && (
            <motion.div key="photo"
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }}
              style={{ display: "flex", flexDirection: "column", gap: 20 }}
            >
              <div style={{ textAlign: "center" }}>
                <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.12em" }}>
                  Step 1 of 2
                </p>
                <p style={{ color: "white", fontWeight: 800, fontSize: 20, margin: 0 }}>Upload Profile Photo</p>
                <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, margin: "6px 0 0", lineHeight: 1.5 }}>
                  Clear, well-lit photo of your face looking at the camera
                </p>
              </div>

              <input ref={photoInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhotoSelect} />

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => photoInputRef.current?.click()}
                style={{
                  width: "100%", height: photoPreview ? "auto" : 180,
                  borderRadius: 16,
                  border: `2px dashed ${photoPreview ? "rgba(236,72,153,0.5)" : "rgba(255,255,255,0.15)"}`,
                  background: "rgba(255,255,255,0.03)",
                  display: "flex", flexDirection: "column", alignItems: "center",
                  justifyContent: "center", gap: 10, cursor: "pointer",
                  overflow: "hidden", padding: photoPreview ? 0 : 24,
                }}
              >
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" style={{ width: "100%", maxHeight: 280, objectFit: "cover" }} />
                ) : (
                  <>
                    <Upload style={{ width: 36, height: 36, color: "rgba(255,255,255,0.25)" }} />
                    <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 14, margin: 0, fontWeight: 600 }}>
                      Tap to choose a photo
                    </p>
                    <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 11, margin: 0 }}>JPG, PNG — max 10MB</p>
                  </>
                )}
              </motion.button>

              {photoPreview && (
                <button
                  onClick={() => photoInputRef.current?.click()}
                  style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "8px 16px", color: "rgba(255,255,255,0.45)", fontSize: 12, cursor: "pointer" }}
                >
                  Change photo
                </button>
              )}

              <motion.button
                whileTap={{ scale: 0.97 }} whileHover={{ scale: 1.01 }}
                onClick={() => { if (!photoFile) { toast.error("Please select a photo first."); return; } setStep("video"); }}
                style={{
                  width: "100%", height: 52, borderRadius: 16, border: "none",
                  background: photoFile ? "linear-gradient(135deg,#ec4899,#a855f7)" : "rgba(255,255,255,0.08)",
                  color: photoFile ? "white" : "rgba(255,255,255,0.3)", fontWeight: 800, fontSize: 15,
                  boxShadow: photoFile ? "0 4px 20px rgba(236,72,153,0.38)" : "none",
                  cursor: "pointer",
                }}
              >
                Next: Video Selfie →
              </motion.button>
            </motion.div>
          )}

          {/* ── STEP 3: Video selfie ── */}
          {step === "video" && (
            <motion.div key="video"
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }}
              style={{ display: "flex", flexDirection: "column", gap: 20 }}
            >
              <div style={{ textAlign: "center" }}>
                <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.12em" }}>
                  Step 2 of 2
                </p>
                <p style={{ color: "white", fontWeight: 800, fontSize: 20, margin: 0 }}>Record Video Selfie</p>
                <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, margin: "6px 0 0", lineHeight: 1.5 }}>
                  3–5 seconds · wave at the camera or smile and say hi
                </p>
              </div>

              <input ref={videoInputRef} type="file" accept="video/*" capture="user" style={{ display: "none" }} onChange={handleVideoSelect} />

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => videoInputRef.current?.click()}
                style={{
                  width: "100%", height: videoPreview ? "auto" : 180,
                  borderRadius: 16,
                  border: `2px dashed ${videoPreview ? "rgba(168,85,247,0.5)" : "rgba(255,255,255,0.15)"}`,
                  background: "rgba(255,255,255,0.03)",
                  display: "flex", flexDirection: "column", alignItems: "center",
                  justifyContent: "center", gap: 10, cursor: "pointer",
                  overflow: "hidden", padding: videoPreview ? 0 : 24,
                }}
              >
                {videoPreview ? (
                  <video src={videoPreview} style={{ width: "100%", maxHeight: 240, objectFit: "cover" }} muted playsInline />
                ) : (
                  <>
                    <Camera style={{ width: 36, height: 36, color: "rgba(255,255,255,0.25)" }} />
                    <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 14, margin: 0, fontWeight: 600 }}>
                      Record or upload a short video
                    </p>
                    <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 11, margin: 0 }}>MP4, MOV — max 50MB</p>
                  </>
                )}
              </motion.button>

              {videoPreview && (
                <button
                  onClick={() => videoInputRef.current?.click()}
                  style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "8px 16px", color: "rgba(255,255,255,0.45)", fontSize: 12, cursor: "pointer" }}
                >
                  Re-record
                </button>
              )}

              <motion.button
                whileTap={{ scale: 0.97 }} whileHover={{ scale: 1.01 }}
                onClick={handleSubmit}
                disabled={uploading}
                style={{
                  width: "100%", height: 52, borderRadius: 16, border: "none",
                  background: videoFile ? "linear-gradient(135deg,#ec4899,#a855f7)" : "rgba(255,255,255,0.08)",
                  color: videoFile ? "white" : "rgba(255,255,255,0.3)", fontWeight: 800, fontSize: 15,
                  boxShadow: videoFile ? "0 4px 20px rgba(236,72,153,0.38)" : "none",
                  cursor: uploading ? "wait" : "pointer",
                  opacity: uploading ? 0.7 : 1,
                }}
              >
                {uploading ? "Uploading…" : "Submit for Review ✓"}
              </motion.button>

              <button
                onClick={() => setStep("photo")}
                style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", fontSize: 13, cursor: "pointer" }}
              >
                ← Back
              </button>
            </motion.div>
          )}

          {/* ── STEP 4: Pending ── */}
          {step === "pending" && (
            <motion.div key="pending"
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, paddingTop: 40 }}
            >
              <motion.div
                animate={{ scale: [1, 1.12, 1] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  width: 80, height: 80, borderRadius: "50%",
                  background: "rgba(74,222,128,0.1)",
                  border: "2px solid rgba(74,222,128,0.35)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <CheckCircle2 style={{ width: 36, height: 36, color: "#4ade80" }} />
              </motion.div>
              <p style={{ color: "white", fontWeight: 900, fontSize: 22, margin: 0, textAlign: "center" }}>
                Submitted!
              </p>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, margin: 0, textAlign: "center", lineHeight: 1.6, maxWidth: 280 }}>
                Our team will review your photo and video within 24 hours. You'll be notified once approved.
              </p>
              <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 12, margin: "8px 0 0", textAlign: "center" }}>
                Redirecting you now…
              </p>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
