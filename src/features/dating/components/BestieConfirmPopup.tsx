import { motion, AnimatePresence } from "framer-motion";
import { Heart, X, MapPin, Sparkles } from "lucide-react";
import { firstName } from "@/shared/utils";
import { isOnline } from "@/shared/hooks/useOnlineStatus";
import { isMockCurrentlyOnline } from "@/shared/utils/mockOnlineSchedule";

function checkOnline(profile: any): boolean {
  if (!profile) return false;
  if (profile.is_mock && profile.mock_online_hours > 0)
    return isMockCurrentlyOnline(profile.id, profile.country ?? "Indonesia", profile.mock_online_hours, profile.mock_offline_days);
  return isOnline(profile.last_seen_at);
}

interface BestieConfirmPopupProps {
  profile: any | null;
  onConfirm: (profile: any) => void;
  onCancel: () => void;
}

export default function BestieConfirmPopup({ profile, onConfirm, onCancel }: BestieConfirmPopupProps) {
  if (!profile) return null;

  const name = firstName(profile.name);
  const avatar = profile.avatar_url || profile.image || "/placeholder.svg";
  const age = profile.age;
  const city = profile.city || profile.country;
  const bio = profile.bio || profile.about || "";

  return (
    <AnimatePresence>
      {profile && (
        <motion.div
          key="bestie-confirm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: "fixed", inset: 0, zIndex: 99999,
            background: "rgba(10,4,24,0.35)",
            backdropFilter: "blur(10px) saturate(1.6) brightness(0.78)",
            WebkitBackdropFilter: "blur(10px) saturate(1.6) brightness(0.78)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "0 20px",
          }}
          onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
        >
          <motion.div
            initial={{ scale: 0.88, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.88, opacity: 0, y: 24 }}
            transition={{ type: "spring", stiffness: 360, damping: 30 }}
            style={{
              width: "100%", maxWidth: 340,
              background: "rgba(8,8,12,0.82)",
              backdropFilter: "blur(40px)",
              WebkitBackdropFilter: "blur(40px)",
              borderRadius: 28,
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 8px 48px rgba(0,0,0,0.7), 0 2px 16px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
              overflow: "hidden",
            }}
          >
            {/* Profile photo banner */}
            <div style={{ position: "relative", height: 200, overflow: "hidden" }}>
              <img
                src={avatar}
                alt={name}
                onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              {/* Pink gradient overlay */}
              <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(to top, rgba(131,24,67,0.85) 0%, rgba(190,24,93,0.25) 55%, transparent 100%)",
              }} />

              {/* Bestie icon top-left */}
              <div style={{
                position: "absolute", top: 12, left: 12,
                width: 58, height: 58, borderRadius: "50%",
                background: "rgba(255,255,255,0.18)",
                backdropFilter: "blur(12px)",
                border: "1.5px solid rgba(236,72,153,0.5)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 0 18px rgba(236,72,153,0.6)",
              }}>
                <img
                  src="https://ik.imagekit.io/7grri5v7d/bestiii-removebg-preview-removebg-preview.png"
                  alt="Bestie"
                  style={{ width: 42, height: 42, objectFit: "contain" }}
                />
              </div>

              {/* Close button */}
              <button
                onClick={onCancel}
                style={{
                  position: "absolute", top: 14, right: 14,
                  width: 32, height: 32, borderRadius: "50%",
                  background: "rgba(255,255,255,0.18)", backdropFilter: "blur(12px)",
                  border: "1px solid rgba(255,255,255,0.3)",
                  color: "rgba(255,255,255,0.9)", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <X style={{ width: 14, height: 14 }} />
              </button>

              {/* Name + age */}
              <div style={{ position: "absolute", bottom: 16, left: 18 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                  <p style={{ color: "#fff", fontWeight: 900, fontSize: 22, margin: 0, textShadow: "0 2px 12px rgba(0,0,0,0.6)" }}>
                    {name}{age ? `, ${age}` : ""}
                  </p>
                  {checkOnline(profile) && (
                    <span style={{
                      width: 11, height: 11, borderRadius: "50%",
                      background: "#22c55e",
                      boxShadow: "0 0 8px rgba(34,197,94,0.9)",
                      animation: "heartbeat 1.4s ease-in-out infinite",
                      display: "inline-block", flexShrink: 0,
                    }} />
                  )}
                </div>
                {city && (
                  <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 11, margin: "4px 0 0", display: "flex", alignItems: "center", gap: 4 }}>
                    <MapPin style={{ width: 10, height: 10 }} /> {city}
                  </p>
                )}
              </div>
            </div>

            {/* Content */}
            <div style={{ padding: "18px 20px 22px", display: "flex", flexDirection: "column", gap: 14 }}>

              {/* Bio snippet */}
              {bio && (
                <p style={{
                  color: "rgba(255,255,255,0.7)", fontSize: 12, lineHeight: 1.6,
                  margin: 0, display: "-webkit-box", WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical", overflow: "hidden",
                  fontStyle: "italic",
                }}>
                  "{bio}"
                </p>
              )}

              {/* Confirm text */}
              <div style={{ textAlign: "center" }}>
                <p style={{ color: "#fff", fontWeight: 800, fontSize: 15, margin: 0 }}>
                  Add{" "}
                  <span style={{ color: "rgba(249,168,212,1)" }}>{name}</span>
                  {" "}as your Bestie?
                </p>
                <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, margin: "6px 0 0", lineHeight: 1.5 }}>
                  Besties appear on each other's profiles and get rewarded.
                </p>
              </div>

              {/* Reward note */}
              <div style={{
                background: "rgba(250,204,21,0.08)",
                border: "1px solid rgba(250,204,21,0.22)",
                borderRadius: 12, padding: "8px 14px",
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <Sparkles style={{ width: 14, height: 14, color: "rgba(250,204,21,0.9)", flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: "rgba(250,204,21,0.9)", fontWeight: 700 }}>
                  +1 free Super Like when they accept
                </span>
              </div>

              {/* Buttons */}
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={onCancel}
                  style={{
                    flex: 1, padding: "12px 0", borderRadius: 16,
                    background: "rgba(255,255,255,0.08)",
                    border: "1.5px solid rgba(255,255,255,0.15)",
                    color: "rgba(255,255,255,0.6)", fontWeight: 700, fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => onConfirm(profile)}
                  style={{
                    flex: 2, padding: "12px 0", borderRadius: 16,
                    background: "linear-gradient(135deg, #f472b6, #ec4899)",
                    border: "none",
                    color: "#fff", fontWeight: 800, fontSize: 13,
                    cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    boxShadow: "0 4px 20px rgba(236,72,153,0.5), 0 1px 4px rgba(0,0,0,0.15)",
                  }}
                >
                  <Heart style={{ width: 14, height: 14 }} fill="white" /> Add as Bestie 💕
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
