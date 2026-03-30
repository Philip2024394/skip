/**
 * DateReviewDialog — shown after a date invitation is marked accepted.
 * Asks: "Did they show up?" + optional star rating + note.
 * Writes to `date_reviews` table; DB trigger updates profile reputation columns.
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, X, Check, ThumbsDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DateReviewDialogProps {
  invitationId: string;
  reviewerId: string;
  reviewedId: string;
  reviewedName: string;
  reviewedAvatar?: string | null;
  onClose: () => void;
}

export default function DateReviewDialog({
  invitationId,
  reviewerId,
  reviewedId,
  reviewedName,
  reviewedAvatar,
  onClose,
}: DateReviewDialogProps) {
  const [showed, setShowed]   = useState<boolean | null>(null);
  const [rating, setRating]   = useState(0);
  const [hoverStar, setHover] = useState(0);
  const [note, setNote]       = useState("");
  const [saving, setSaving]   = useState(false);

  const handleSubmit = async () => {
    if (showed === null) { toast.error("Did they show up?"); return; }
    setSaving(true);
    try {
      const { error } = await (supabase as any).from("date_reviews").insert({
        invitation_id: invitationId,
        reviewer_id:   reviewerId,
        reviewed_id:   reviewedId,
        showed_up:     showed,
        rating:        rating || null,
        note:          note.trim() || null,
      });
      if (error) throw error;
      toast.success("Review saved — thanks for keeping the community safe!");
      onClose();
    } catch (err: any) {
      if (err?.code === "23505") { toast("You've already reviewed this date."); onClose(); }
      else toast.error("Could not save review");
    } finally { setSaving(false); }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative w-full max-w-md rounded-t-3xl p-6 space-y-5 overflow-hidden"
        style={{ background: "#111", maxHeight: "90vh", overflowY: "auto" }}
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 280 }}
      >
        {/* Close */}
        <button onClick={onClose} className="absolute top-4 right-4 text-white/30 hover:text-white">
          <X className="w-5 h-5" />
        </button>

        {/* Profile preview */}
        <div className="flex flex-col items-center gap-2 pt-1">
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-pink-500/40">
            <img src={reviewedAvatar || "/placeholder.svg"} alt={reviewedName}
              className="w-full h-full object-cover" />
          </div>
          <div className="text-center">
            <h2 className="text-white font-bold">How was your date with {reviewedName}?</h2>
            <p className="text-white/40 text-xs mt-0.5">Your review is anonymous and helps others stay safe</p>
          </div>
        </div>

        {/* Showed up? */}
        <div>
          <p className="text-white/70 text-sm font-semibold mb-2">Did {reviewedName} show up?</p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowed(true)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all"
              style={showed === true
                ? { background: "rgba(34,197,94,0.25)", border: "1px solid rgba(34,197,94,0.5)", color: "#4ade80" }
                : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>
              <Check className="w-4 h-4" /> Yes, showed up
            </button>
            <button
              onClick={() => { setShowed(false); setRating(0); }}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all"
              style={showed === false
                ? { background: "rgba(239,68,68,0.25)", border: "1px solid rgba(239,68,68,0.5)", color: "#f87171" }
                : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>
              <ThumbsDown className="w-4 h-4" /> No-show
            </button>
          </div>
        </div>

        {/* Star rating — only if showed up */}
        <AnimatePresence>
          {showed === true && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
              <p className="text-white/70 text-sm font-semibold mb-2">Rate the date (optional)</p>
              <div className="flex gap-2 justify-center">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    onMouseEnter={() => setHover(n)}
                    onMouseLeave={() => setHover(0)}
                    onClick={() => setRating(r => r === n ? 0 : n)}
                    className="text-2xl transition-transform hover:scale-110"
                  >
                    <Star
                      className="w-7 h-7 transition-colors"
                      fill={(hoverStar || rating) >= n ? "#f59e0b" : "transparent"}
                      color={(hoverStar || rating) >= n ? "#f59e0b" : "rgba(255,255,255,0.2)"}
                    />
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Note */}
        <div>
          <p className="text-white/70 text-sm font-semibold mb-2">Leave a note (optional, anonymous)</p>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="How was the vibe? Anything useful for others…"
            rows={3}
            maxLength={200}
            className="w-full bg-white/6 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/30 resize-none"
          />
          <p className="text-white/25 text-xs text-right mt-1">{note.length}/200</p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={saving || showed === null}
          className="w-full py-3 rounded-xl font-bold text-white transition-all active:scale-95 disabled:opacity-50"
          style={{ background: "linear-gradient(135deg,#ec4899,#a855f7)" }}
        >
          {saving ? "Saving…" : "Submit Review"}
        </button>
      </motion.div>
    </motion.div>
  );
}
