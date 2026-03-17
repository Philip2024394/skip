import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShieldCheck, Upload, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface VerificationSubmitDialogProps {
  userAge: number | null;
  onClose: () => void;
  onSubmitted: () => void; // called after successful submission → proceed to payment
}

export default function VerificationSubmitDialog({
  userAge,
  onClose,
  onSubmitted,
}: VerificationSubmitDialogProps) {
  const [idType, setIdType] = useState<"ktp" | "passport">("ktp");
  const [fullName, setFullName] = useState("");
  const [idAge, setIdAge] = useState("");
  const [idFile, setIdFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [ageError, setAgeError] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setIdFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async () => {
    if (!fullName.trim()) { toast.error("Please enter your full name as on your ID."); return; }
    if (!idAge || isNaN(Number(idAge))) { toast.error("Please enter a valid age from your ID."); return; }
    if (!idFile) { toast.error("Please upload a photo of your ID."); return; }

    const submittedAge = Number(idAge);
    // Age must match profile age (allow ±1 for birthday timing)
    if (userAge !== null && Math.abs(submittedAge - userAge) > 1) {
      setAgeError(true);
      toast.error("The age on your ID must match your profile age.");
      return;
    }
    setAgeError(false);
    setSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not signed in");

      // Upload ID photo to Supabase storage
      const ext = idFile.name.split(".").pop() || "jpg";
      const path = `verification/${session.user.id}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("id-verifications")
        .upload(path, idFile, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("id-verifications").getPublicUrl(path);
      const idUrl = urlData.publicUrl;

      // Save verification request on profile row
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          verification_status: "pending",
          verification_id_type: idType,
          verification_name: fullName.trim(),
          verification_age: submittedAge,
          verification_id_url: idUrl,
        } as any)
        .eq("id", session.user.id);

      if (updateError) throw updateError;

      toast.success("ID submitted! Admin will review within 24 hours. Proceed to payment.");
      onSubmitted();
    } catch (err: any) {
      toast.error(err.message || "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[400] flex items-end justify-center"
        style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(12px)" }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
          className="w-full max-w-md bg-[#0a0018] border border-white/10 rounded-t-3xl overflow-hidden"
        >
          <div className="h-1 w-full bg-gradient-to-r from-sky-400 via-blue-500 to-sky-400" />

          <div className="p-5 space-y-4 max-h-[88vh] overflow-y-auto pb-8">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-sky-400" />
                <h2 className="text-white font-bold text-base">ID Verification — $2.99</h2>
              </div>
              <button onClick={onClose} className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/50 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-white/50 text-xs leading-relaxed">
              Submit your KTP or Passport. Admin will review your ID and approve within 24 hours.
              Your age must match your profile. The verified badge will appear after approval.
            </p>

            {/* ID Type */}
            <div>
              <p className="text-white/60 text-xs font-semibold mb-2">ID Type</p>
              <div className="grid grid-cols-2 gap-2">
                {(["ktp", "passport"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setIdType(type)}
                    className={`h-10 rounded-xl text-sm font-semibold border transition-all ${
                      idType === type
                        ? "bg-sky-500/20 border-sky-400/60 text-sky-300"
                        : "bg-white/5 border-white/10 text-white/50"
                    }`}
                  >
                    {type === "ktp" ? "🇮🇩 KTP" : "📘 Passport"}
                  </button>
                ))}
              </div>
            </div>

            {/* Full name */}
            <div>
              <p className="text-white/60 text-xs font-semibold mb-1.5">Full Name (as on ID)</p>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Putri Dewi Ayu"
                className="w-full h-10 rounded-xl bg-white/5 border border-white/10 text-white text-sm px-3 placeholder:text-white/25 focus:outline-none focus:border-sky-400/50"
              />
            </div>

            {/* Age on ID */}
            <div>
              <p className="text-white/60 text-xs font-semibold mb-1.5">Age on ID</p>
              <input
                type="number"
                value={idAge}
                onChange={(e) => { setIdAge(e.target.value); setAgeError(false); }}
                placeholder="e.g. 24"
                min={17}
                max={80}
                className={`w-full h-10 rounded-xl bg-white/5 border text-white text-sm px-3 placeholder:text-white/25 focus:outline-none ${
                  ageError ? "border-red-400/60 bg-red-500/10" : "border-white/10 focus:border-sky-400/50"
                }`}
              />
              {ageError && (
                <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Age must match your profile age ({userAge}).
                </p>
              )}
            </div>

            {/* ID photo upload */}
            <div>
              <p className="text-white/60 text-xs font-semibold mb-1.5">Photo of your ID</p>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFile}
              />
              {preview ? (
                <div className="relative rounded-xl overflow-hidden border border-white/10" style={{ height: 140 }}>
                  <img src={preview} alt="ID preview" className="w-full h-full object-cover" />
                  <button
                    onClick={() => { setIdFile(null); setPreview(null); }}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center text-white/70"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full h-24 rounded-xl border-2 border-dashed border-white/15 flex flex-col items-center justify-center gap-2 text-white/40 hover:text-white/60 hover:border-white/25 transition-colors"
                >
                  <Upload className="w-5 h-5" />
                  <span className="text-xs">Tap to upload KTP / Passport photo</span>
                </button>
              )}
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full h-12 rounded-2xl font-bold text-white text-sm flex items-center justify-center gap-2 disabled:opacity-60 transition-all active:scale-95"
              style={{ background: "linear-gradient(135deg, #38bdf8, #3b82f6)" }}
            >
              {submitting ? "Submitting..." : "Submit ID & Proceed to Payment →"}
            </button>

            <p className="text-white/25 text-[10px] text-center">
              Your ID is stored securely and only reviewed by admins. It is never shared publicly.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
