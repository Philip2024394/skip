import { motion, AnimatePresence } from "framer-motion";
import { X, Eye } from "lucide-react";

export interface BestieReferral {
  fromName: string;       // User B who passed
  bestieAppId: string;    // 2D-XXXXX of the suggested bestie
  bestieName?: string;
  bestieAvatar?: string;
  bestieProfileId?: string;
}

interface BestieReferralPopupProps {
  referral: BestieReferral | null;
  onViewProfile: (profileId: string) => void;
  onClose: () => void;
}

export default function BestieReferralPopup({ referral, onViewProfile, onClose }: BestieReferralPopupProps) {
  return (
    <AnimatePresence>
      {referral && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(0,0,0,0.72)",
            backdropFilter: "blur(8px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "0 24px",
          }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 24 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            style={{
              width: "100%", maxWidth: 340,
              background: "linear-gradient(160deg, #0d001e 0%, #1a0030 100%)",
              borderRadius: 24,
              border: "1.5px solid rgba(139,92,246,0.3)",
              boxShadow: "0 24px 64px rgba(0,0,0,0.65), 0 0 0 1px rgba(139,92,246,0.1)",
              overflow: "hidden",
              padding: "26px 22px 22px",
            }}
          >
            {/* Close */}
            <button
              onClick={onClose}
              style={{ position: "absolute", top: 14, right: 14, background: "rgba(255,255,255,0.06)", border: "none", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.4)" }}
            >
              <X style={{ width: 13, height: 13 }} />
            </button>

            {/* Icon + header */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, marginBottom: 18 }}>
              <div style={{
                width: 56, height: 56, borderRadius: "50%",
                background: "linear-gradient(135deg, rgba(139,92,246,0.25), rgba(99,102,241,0.2))",
                border: "1.5px solid rgba(139,92,246,0.4)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 28,
              }}>
                👯
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ color: "#fff", fontWeight: 800, fontSize: 16, margin: 0 }}>Bestie Match Suggestion</p>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 4, lineHeight: 1.5 }}>
                  {referral.fromName} passed on your Super Like
                </p>
              </div>
            </div>

            {/* The message */}
            <div style={{
              background: "rgba(139,92,246,0.1)",
              border: "1px solid rgba(139,92,246,0.25)",
              borderRadius: 16,
              padding: "14px 16px",
              marginBottom: 16,
              textAlign: "center",
            }}>
              <p style={{ color: "rgba(200,180,255,0.9)", fontSize: 13, lineHeight: 1.6, margin: 0, fontStyle: "italic" }}>
                "I appreciate the Super Like — but I think my bestie might be a better match for you 💕"
              </p>
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginTop: 6, fontStyle: "normal" }}>
                — {referral.fromName}
              </p>
            </div>

            {/* Bestie card */}
            <div style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 16,
              padding: "14px 16px",
              marginBottom: 18,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}>
              {referral.bestieAvatar ? (
                <img
                  src={referral.bestieAvatar}
                  alt={referral.bestieName || "Bestie"}
                  onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
                  style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(139,92,246,0.5)", flexShrink: 0 }}
                />
              ) : (
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(139,92,246,0.2)", border: "2px solid rgba(139,92,246,0.4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 22 }}>
                  👤
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: "#fff", fontWeight: 700, fontSize: 14, margin: 0 }}>
                  {referral.bestieName || "Their Bestie"}
                </p>
                <span style={{
                  display: "inline-block", marginTop: 3,
                  background: "rgba(139,92,246,0.15)",
                  border: "1px solid rgba(139,92,246,0.3)",
                  borderRadius: 999, padding: "2px 8px",
                  fontSize: 11, fontWeight: 700, color: "rgba(167,139,250,0.9)",
                  letterSpacing: "0.06em",
                }}>
                  {referral.bestieAppId}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={onClose}
                style={{
                  flex: 1, padding: "11px 0", borderRadius: 14,
                  background: "rgba(255,255,255,0.06)",
                  border: "1.5px solid rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.5)", fontWeight: 700, fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Maybe Later
              </button>
              {referral.bestieProfileId ? (
                <button
                  onClick={() => { onViewProfile(referral.bestieProfileId!); onClose(); }}
                  style={{
                    flex: 2, padding: "11px 0", borderRadius: 14,
                    background: "linear-gradient(135deg, rgba(139,92,246,0.9), rgba(99,102,241,0.9))",
                    border: "none",
                    color: "#fff", fontWeight: 800, fontSize: 13,
                    cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    boxShadow: "0 4px 14px rgba(139,92,246,0.35)",
                  }}
                >
                  <Eye style={{ width: 14, height: 14 }} /> View Profile
                </button>
              ) : (
                <div style={{
                  flex: 2, padding: "11px 14px", borderRadius: 14,
                  background: "rgba(139,92,246,0.1)",
                  border: "1px solid rgba(139,92,246,0.25)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <p style={{ color: "rgba(167,139,250,0.7)", fontSize: 11, fontWeight: 600, margin: 0, textAlign: "center" }}>
                    Ask {referral.fromName} to share their bestie's profile
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
