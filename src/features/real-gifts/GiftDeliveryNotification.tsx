import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Camera, Heart, Upload } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface GiftNotification {
  order_id: string;
  gift_emoji: string;
  gift_type: string;
  sender_name: string; // kept anonymous to sender — shown as "a secret admirer" unless sender opts to reveal
  reveal_sender: boolean;
  delivery_eta: string; // ISO string
  notif_stage: 1 | 2 | 3; // set by admin/system as time progresses
  dismissed_stages: number[];
}

const LS_KEY_PREFIX = "gift_notification_";

export function getGiftNotification(userId: string): GiftNotification | null {
  try {
    const raw = localStorage.getItem(LS_KEY_PREFIX + userId);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function setGiftNotificationStage(userId: string, stage: 1 | 2 | 3) {
  try {
    const existing = getGiftNotification(userId);
    if (existing) {
      localStorage.setItem(LS_KEY_PREFIX + userId, JSON.stringify({ ...existing, notif_stage: stage }));
    }
  } catch { /* ignore */ }
}

export function clearGiftNotification(userId: string) {
  try { localStorage.removeItem(LS_KEY_PREFIX + userId); } catch { /* ignore */ }
}

// ── Main component ─────────────────────────────────────────────────────────────
export const GiftDeliveryNotification = ({
  userId,
  onDismiss,
}: {
  userId: string;
  onDismiss: () => void;
}) => {
  const [notif, setNotif] = useState<GiftNotification | null>(() => getGiftNotification(userId));
  const [thankYouText, setThankYouText] = useState("");
  const [photoUploaded, setPhotoUploaded] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [dismissedStages, setDismissedStages] = useState<number[]>([]);

  // Auto-advance stage based on delivery eta
  useEffect(() => {
    if (!notif) return;
    const eta = new Date(notif.delivery_eta).getTime();
    const now = Date.now();
    const hoursUntil = (eta - now) / (1000 * 60 * 60);

    if (now >= eta && notif.notif_stage < 3) {
      const updated = { ...notif, notif_stage: 3 as const };
      localStorage.setItem(LS_KEY_PREFIX + userId, JSON.stringify(updated));
      setNotif(updated);
    } else if (hoursUntil <= 2 && notif.notif_stage < 2) {
      const updated = { ...notif, notif_stage: 2 as const };
      localStorage.setItem(LS_KEY_PREFIX + userId, JSON.stringify(updated));
      setNotif(updated);
    }
  }, [notif, userId]);

  if (!notif) return null;

  const currentStage = notif.notif_stage;
  const alreadyDismissed = dismissedStages.includes(currentStage);
  if (alreadyDismissed) return null;

  const dismissStage = () => {
    setDismissedStages(prev => [...prev, currentStage]);
    // Mark dismissed in localStorage
    try {
      const updated = { ...notif, dismissed_stages: [...(notif.dismissed_stages || []), currentStage] };
      localStorage.setItem(LS_KEY_PREFIX + userId, JSON.stringify(updated));
    } catch { /* ignore */ }
    if (currentStage === 3 && submitted) {
      clearGiftNotification(userId);
      onDismiss();
    }
  };

  const handleSubmitThankYou = () => {
    setSubmitted(true);
    // Store thank you for admin (in real app this would go to Supabase)
    try {
      const thanks = {
        order_id: notif.order_id,
        thank_you_text: thankYouText,
        has_photo: photoUploaded,
        submitted_at: new Date().toISOString(),
      };
      const existing = JSON.parse(localStorage.getItem("gift_thank_yous") || "[]");
      localStorage.setItem("gift_thank_yous", JSON.stringify([thanks, ...existing]));
    } catch { /* ignore */ }
  };

  const senderLabel = notif.reveal_sender ? notif.sender_name : "a secret admirer";

  const STAGES = {
    1: {
      emoji: notif.gift_emoji,
      title: "A gift is on its way to you! 🎁",
      subtitle: `${senderLabel} sent you ${notif.gift_type.toLowerCase()}. It's been arranged and is coming to you soon!`,
      color: "#F59E0B",
      bg: "rgba(245,158,11,0.08)",
      border: "rgba(245,158,11,0.25)",
      showUpload: false,
    },
    2: {
      emoji: "🚚",
      title: "Your gift is almost here!",
      subtitle: `Your ${notif.gift_type.toLowerCase()} should be arriving very soon. Get ready to receive it!`,
      color: "#8B5CF6",
      bg: "rgba(139,92,246,0.08)",
      border: "rgba(139,92,246,0.25)",
      showUpload: false,
    },
    3: {
      emoji: "📸",
      title: "Did you receive your gift?",
      subtitle: `Your ${notif.gift_type.toLowerCase()} from ${senderLabel} should have arrived. Share a photo and a thank you message — it means the world! (Completely optional.)`,
      color: "#22C55E",
      bg: "rgba(34,197,94,0.08)",
      border: "rgba(34,197,94,0.25)",
      showUpload: true,
    },
  };

  const stage = STAGES[currentStage];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
        className="fixed bottom-24 left-3 right-3 z-[150] rounded-3xl overflow-hidden"
        style={{ background: "#111", border: `1px solid ${stage.border}` }}
      >
        {/* Colored top bar */}
        <div className="h-1" style={{ background: stage.color }} />

        <div className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ background: stage.bg, border: `1px solid ${stage.border}` }}>
                {stage.emoji}
              </div>
              <div>
                <p className="text-white font-bold text-sm leading-tight">{stage.title}</p>
                <p className="text-xs mt-0.5" style={{ color: stage.color }}>Order #{notif.order_id}</p>
              </div>
            </div>
            <button onClick={dismissStage} className="text-white/30 hover:text-white/60 ml-2">
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-white/60 text-xs leading-relaxed mb-4">{stage.subtitle}</p>

          {/* Stage 3: Upload + Thank you */}
          {stage.showUpload && !submitted && (
            <div className="space-y-3">
              {/* Photo upload */}
              <label className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all"
                style={{ background: photoUploaded ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.05)", border: `1px solid ${photoUploaded ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.1)"}` }}>
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={e => { if (e.target.files?.length) setPhotoUploaded(true); }}
                />
                {photoUploaded ? (
                  <>
                    <Camera className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span className="text-green-400 text-sm font-medium">Photo ready to share ✓</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 text-white/40 flex-shrink-0" />
                    <span className="text-white/50 text-sm">Upload a photo with your gift</span>
                    <span className="text-white/25 text-xs ml-auto">Optional</span>
                  </>
                )}
              </label>

              {/* Thank you message */}
              <textarea
                value={thankYouText}
                onChange={e => setThankYouText(e.target.value)}
                placeholder="Write a thank you message... (optional)"
                rows={2}
                maxLength={200}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder-white/30 resize-none"
              />
              {thankYouText.length > 0 && (
                <p className="text-white/25 text-xs text-right">{thankYouText.length}/200</p>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleSubmitThankYou}
                  className="flex-1 py-3 rounded-xl text-sm font-bold text-black flex items-center justify-center gap-1.5"
                  style={{ background: "#22c55e" }}
                >
                  <Heart className="w-4 h-4" /> Send Thank You
                </button>
                <button onClick={dismissStage} className="px-4 rounded-xl text-sm text-white/40 border border-white/10">
                  Skip
                </button>
              </div>
            </div>
          )}

          {/* After submit */}
          {stage.showUpload && submitted && (
            <div className="text-center py-2">
              <p className="text-green-400 text-sm font-semibold mb-1">Thank you sent! 💚</p>
              <p className="text-white/40 text-xs mb-3">Your appreciation has been shared.</p>
              <button onClick={() => { clearGiftNotification(userId); onDismiss(); }}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-black" style={{ background: "#22c55e" }}>
                Close
              </button>
            </div>
          )}

          {/* Stage 1 + 2 dismiss */}
          {!stage.showUpload && (
            <button onClick={dismissStage}
              className="w-full py-2.5 rounded-xl text-sm text-white/50 border border-white/10">
              Got it 👌
            </button>
          )}
        </div>

        {/* Stage counter dots */}
        <div className="flex justify-center gap-1.5 pb-3">
          {[1, 2, 3].map(s => (
            <div key={s} className="rounded-full transition-all"
              style={{
                width: s === currentStage ? 16 : 6,
                height: 6,
                background: s === currentStage ? stage.color : "rgba(255,255,255,0.15)",
              }} />
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GiftDeliveryNotification;
