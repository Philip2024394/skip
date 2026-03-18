import { motion, AnimatePresence } from "framer-motion";
import { MapPin, X, Plane } from "lucide-react";
import { firstName } from "@/shared/utils";
import { isOnline } from "@/shared/hooks/useOnlineStatus";
import { isMockCurrentlyOnline } from "@/shared/utils/mockOnlineSchedule";

function checkOnline(profile: any): boolean {
  if (!profile) return false;
  if (profile.is_mock && profile.mock_online_hours > 0)
    return isMockCurrentlyOnline(profile.id, profile.country ?? "Indonesia", profile.mock_online_hours, profile.mock_offline_days);
  return isOnline(profile.last_seen_at);
}

export type TravelNoticeType = "open_to_travel" | "coming_to_city";

interface TravelNoticePopupProps {
  profile: any;
  type: TravelNoticeType;
  yourCity?: string;
  onLike: (profile: any) => void;
  onDismiss: () => void;
}

const TRAVEL_SESSION_KEY = "2dateme_travel_notice_last";
const MIN_INTERVAL_MS = 8 * 60 * 1000; // min 8 minutes between travel notices

export function shouldShowTravelNotice(): boolean {
  try {
    const last = localStorage.getItem(TRAVEL_SESSION_KEY);
    if (!last) return true;
    return Date.now() - Number(last) > MIN_INTERVAL_MS;
  } catch {
    return false;
  }
}

export function markTravelNoticeShown(): void {
  try {
    localStorage.setItem(TRAVEL_SESSION_KEY, String(Date.now()));
  } catch {}
}

export default function TravelNoticePopup({ profile, type, yourCity, onLike, onDismiss }: TravelNoticePopupProps) {
  if (!profile) return null;

  const name = firstName(profile.name);
  const avatar = profile.avatar_url || profile.image || "/placeholder.svg";
  const age = profile.age;
  const city = profile.city || profile.country || "Indonesia";
  const bio = profile.bio || profile.about || "";

  const isTravel = type === "open_to_travel";
  const headline = isTravel
    ? `${name} is open to travel`
    : `${name} may be coming to ${yourCity || "your city"}`;
  const subtext = isTravel
    ? `${name} is open to visiting new cities and meeting someone special along the way.`
    : `${name} has shown interest in visiting ${yourCity || "your city"} soon — say hello before they arrive.`;

  return (
    <AnimatePresence>
      {profile && (
        <motion.div
          key="travel-notice"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: "fixed", inset: 0, zIndex: 290,
            background: "rgba(10,4,24,0.35)",
            backdropFilter: "blur(10px) saturate(1.6) brightness(0.78)",
            WebkitBackdropFilter: "blur(10px) saturate(1.6) brightness(0.78)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "0 20px",
          }}
          onClick={(e) => { if (e.target === e.currentTarget) onDismiss(); }}
        >
          <motion.div
            initial={{ scale: 0.88, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.88, opacity: 0, y: 24 }}
            transition={{ type: "spring", stiffness: 340, damping: 28 }}
            style={{
              width: "100%", maxWidth: 340,
              background: "rgba(8,8,12,0.88)",
              backdropFilter: "blur(40px)",
              WebkitBackdropFilter: "blur(40px)",
              borderRadius: 28,
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 8px 48px rgba(0,0,0,0.7), 0 2px 16px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
              overflow: "hidden",
            }}
          >
            {/* Accent bar */}
            <div style={{ height: 3, width: "100%", background: "linear-gradient(90deg, #ec4899, #f472b6, #ec4899)" }} />

            {/* Photo banner */}
            <div style={{ position: "relative", height: 190, overflow: "hidden" }}>
              <img
                src={avatar}
                alt={name}
                onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(to top, rgba(4,0,16,0.92) 0%, rgba(4,0,16,0.2) 55%, transparent 100%)",
              }} />

              {/* Travel badge top-left */}
              <div style={{
                position: "absolute", top: 12, left: 12,
                background: isTravel ? "rgba(236,72,153,0.85)" : "rgba(59,130,246,0.85)",
                backdropFilter: "blur(8px)",
                borderRadius: 20, padding: "4px 10px",
                display: "flex", alignItems: "center", gap: 5,
              }}>
                <Plane size={10} style={{ color: "#fff" }} />
                <span style={{ fontSize: 9, fontWeight: 800, color: "#fff", letterSpacing: "0.06em" }}>
                  {isTravel ? "Open to Travel" : "Coming Soon"}
                </span>
              </div>

              {/* Close */}
              <button
                onClick={onDismiss}
                style={{
                  position: "absolute", top: 12, right: 12,
                  width: 30, height: 30, borderRadius: "50%",
                  background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255,255,255,0.25)",
                  color: "rgba(255,255,255,0.85)", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <X size={13} />
              </button>

              {/* Name + location */}
              <div style={{ position: "absolute", bottom: 14, left: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 2 }}>
                  <p style={{ color: "#fff", fontWeight: 900, fontSize: 20, margin: 0, textShadow: "0 2px 10px rgba(0,0,0,0.7)" }}>
                    {name}{age ? `, ${age}` : ""}
                  </p>
                  {checkOnline(profile) && (
                    <span style={{
                      width: 10, height: 10, borderRadius: "50%",
                      background: "#22c55e",
                      boxShadow: "0 0 8px rgba(34,197,94,0.9)",
                      animation: "heartbeat 1.4s ease-in-out infinite",
                      display: "inline-block", flexShrink: 0,
                    }} />
                  )}
                </div>
                <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, margin: "3px 0 0", display: "flex", alignItems: "center", gap: 4 }}>
                  <MapPin size={10} /> {city}
                </p>
              </div>
            </div>

            {/* Content */}
            <div style={{ padding: "16px 18px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Headline */}
              <div style={{
                background: "rgba(236,72,153,0.07)",
                border: "1px solid rgba(236,72,153,0.2)",
                borderRadius: 12, padding: "10px 12px",
              }}>
                <p style={{ color: "rgba(236,72,153,0.95)", fontSize: 12, fontWeight: 800, margin: "0 0 4px" }}>
                  ✈️ {headline}
                </p>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, lineHeight: 1.5, margin: 0 }}>
                  {subtext}
                </p>
              </div>

              {/* Bio snippet */}
              {bio && (
                <p style={{
                  color: "rgba(255,255,255,0.5)", fontSize: 11, lineHeight: 1.55,
                  margin: 0, display: "-webkit-box", WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical", overflow: "hidden", fontStyle: "italic",
                }}>
                  "{bio}"
                </p>
              )}

              {/* Buttons */}
              <div style={{ display: "flex", gap: 10, marginTop: 2 }}>
                <button
                  onClick={onDismiss}
                  style={{
                    flex: 1, padding: "11px 0", borderRadius: 16,
                    background: "rgba(255,255,255,0.06)",
                    border: "1.5px solid rgba(255,255,255,0.1)",
                    color: "rgba(255,255,255,0.5)", fontWeight: 700, fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  Maybe later
                </button>
                <button
                  onClick={() => onLike(profile)}
                  style={{
                    flex: 2, padding: "11px 0", borderRadius: 16,
                    background: "linear-gradient(135deg, #ec4899, #f472b6)",
                    border: "none",
                    color: "#fff", fontWeight: 800, fontSize: 13,
                    cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    boxShadow: "0 4px 18px rgba(236,72,199,0.45)",
                  }}
                >
                  💗 Say Hello
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
