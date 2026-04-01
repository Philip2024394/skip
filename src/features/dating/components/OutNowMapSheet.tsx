import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, MapPin, Clock, Navigation } from "lucide-react";

interface Props {
  profile: {
    id: string;
    name: string;
    avatar_url?: string;
    distanceBand?: string;       // "under 1km" | "1–2km" | "2–5km" | "nearby"
    distanceKm?: number;         // rough km (rounded, not exact)
    isVerified?: boolean;
    meet_now_expires_at?: string;
    latitude?: number;
    longitude?: number;
  };
  currentLat?: number;
  currentLng?: number;
  isLocked?: boolean;
  lockExpiresAt?: string | null;
  onOTW: () => Promise<void>;
  onClose: () => void;
}

function fmtCountdown(ms: number): string {
  if (ms <= 0) return "0:00";
  const m = Math.floor(ms / 60_000);
  const s = Math.floor((ms % 60_000) / 1_000);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function travelEstimate(km: number) {
  const walkMin = Math.round((km / 5) * 60);       // 5 km/hr walk
  const driveMin = Math.round((km / 25) * 60);     // 25 km/hr city drive
  if (km < 0.5) return { walk: "~5 min", drive: "~2 min" };
  return {
    walk: walkMin <= 60 ? `~${walkMin} min` : `~${Math.round(walkMin / 60)}h`,
    drive: driveMin <= 2 ? "~2 min" : `~${driveMin} min`,
  };
}

// Rough km from distance band string
function kmFromBand(band?: string): number {
  if (!band) return 2;
  if (band.includes("under 1")) return 0.5;
  if (band.includes("1–2")) return 1.5;
  if (band.includes("2–5")) return 3;
  return 5;
}

// Build an OpenStreetMap embed URL centred on a rounded coordinate (privacy: 2dp ≈ 1km precision)
function buildMapUrl(lat?: number, lng?: number): string | null {
  if (!lat || !lng) return null;
  const rLat = Math.round(lat * 100) / 100;
  const rLng = Math.round(lng * 100) / 100;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${rLng - 0.015},${rLat - 0.015},${rLng + 0.015},${rLat + 0.015}&layer=mapnik&marker=${rLat},${rLng}`;
}

export default function OutNowMapSheet({ profile, currentLat, currentLng, isLocked, lockExpiresAt, onOTW, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(id);
  }, []);

  const km = profile.distanceKm ?? kmFromBand(profile.distanceBand);
  const { walk, drive } = travelEstimate(km);
  const band = profile.distanceBand ?? `~${km} km`;
  const mapUrl = buildMapUrl(profile.latitude, profile.longitude);
  const lockMs = lockExpiresAt ? Math.max(0, new Date(lockExpiresAt).getTime() - now) : 0;
  const timeLeft = profile.meet_now_expires_at ? Math.max(0, new Date(profile.meet_now_expires_at).getTime() - now) : 0;
  const hoursLeft = Math.floor(timeLeft / 3_600_000);
  const minsLeft = Math.floor((timeLeft % 3_600_000) / 60_000);

  const handleOTW = async () => {
    setLoading(true);
    await onOTW();
    setLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, zIndex: 190,
        background: "rgba(0,0,0,0.88)",
        backdropFilter: "blur(10px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 280 }}
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 480,
          background: "linear-gradient(180deg, #1a1a2e 0%, #0f0f1a 100%)",
          borderRadius: "28px 28px 0 0",
          border: "1px solid rgba(255,255,255,0.08)",
          overflow: "hidden",
          boxShadow: "0 -20px 60px rgba(0,0,0,0.8)",
          maxHeight: "90vh",
          display: "flex", flexDirection: "column",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px 12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ position: "relative" }}>
              <img
                src={profile.avatar_url || "/placeholder.svg"}
                alt={profile.name}
                style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(251,191,36,0.5)" }}
              />
              {/* Out Now pulse dot */}
              <span style={{ position: "absolute", bottom: 0, right: 0, width: 13, height: 13 }}>
                <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "#fbbf24", animation: "ping 1.5s infinite", opacity: 0.7 }} />
                <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "#fbbf24" }} />
              </span>
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>
                  {profile.name.split(" ")[0]}
                </span>
                {profile.isVerified && <span style={{ fontSize: 13 }}>✅</span>}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                <span style={{
                  fontSize: 9, fontWeight: 800, letterSpacing: "0.06em",
                  background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.4)",
                  color: "#fbbf24", borderRadius: 20, padding: "2px 8px",
                }}>⚡ OUT NOW</span>
                {timeLeft > 0 && (
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>
                    {hoursLeft > 0 ? `${hoursLeft}h ` : ""}{minsLeft}m left
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.08)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <X className="w-4 h-4 text-white/50" />
          </button>
        </div>

        {/* Map */}
        <div style={{ position: "relative", height: 200, background: "rgba(255,255,255,0.04)", flexShrink: 0 }}>
          {mapUrl ? (
            <iframe
              src={mapUrl}
              style={{ width: "100%", height: "100%", border: "none", filter: "invert(0.85) hue-rotate(180deg) saturate(0.6)" }}
              title="Approximate location"
              loading="lazy"
            />
          ) : (
            <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8 }}>
              <MapPin className="w-8 h-8 text-yellow-400/40" />
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>Location not available</span>
            </div>
          )}
          {/* Privacy overlay badge */}
          <div style={{
            position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)",
            background: "rgba(0,0,0,0.75)", borderRadius: 20, padding: "4px 12px",
            display: "flex", alignItems: "center", gap: 5,
            backdropFilter: "blur(8px)",
          }}>
            <MapPin className="w-3 h-3 text-yellow-400" />
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>
              Approximate area only — exact location never shown
            </span>
          </div>
        </div>

        {/* Distance + travel time */}
        <div style={{ display: "flex", gap: 10, padding: "14px 20px 0" }}>
          <div style={{
            flex: 1, background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)",
            borderRadius: 14, padding: "10px 12px", display: "flex", alignItems: "center", gap: 8,
          }}>
            <Navigation className="w-4 h-4 text-yellow-400 flex-shrink-0" />
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#fbbf24" }}>{band}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>distance</div>
            </div>
          </div>
          <div style={{
            flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 14, padding: "10px 12px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}>
              <Clock className="w-3 h-3 text-white/40" />
              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontWeight: 700, letterSpacing: "0.05em" }}>TRAVEL TIME</span>
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
              🚶 {walk} &nbsp;·&nbsp; 🚗 {drive}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div style={{ padding: "14px 20px 32px" }}>
          {isLocked && lockMs > 0 ? (
            <div style={{ textAlign: "center", padding: "12px 0" }}>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginBottom: 8 }}>
                Someone is already on their way
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#fbbf24", fontVariantNumeric: "tabular-nums" }}>
                {fmtCountdown(lockMs)}
              </div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>remaining in their window</div>
            </div>
          ) : (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleOTW}
              disabled={loading}
              style={{
                width: "100%", padding: "16px",
                borderRadius: 18,
                background: loading ? "rgba(251,191,36,0.4)" : "linear-gradient(135deg, #fbbf24, #f59e0b)",
                border: "none", cursor: loading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                boxShadow: "0 4px 24px rgba(251,191,36,0.35)",
              }}
            >
              {loading ? (
                <div style={{ width: 18, height: 18, border: "2px solid rgba(0,0,0,0.3)", borderTop: "2px solid #000", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              ) : (
                <>
                  <Zap className="w-5 h-5 text-black" />
                  <span style={{ fontSize: 16, fontWeight: 800, color: "#000" }}>On The Way — $2.99</span>
                </>
              )}
            </motion.button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
