import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "@/shared/types/profile";
import TonightRequestModal from "./TonightRequestModal";

interface FreeTonightSheetProps {
  open: boolean;
  onClose: () => void;
  currentUserId: string;
  currentUserCoins: number;
  onCoinsSpent: (amount: number) => void;
}

function ProfileCard({
  profile,
  liked,
  onLike,
}: {
  profile: Profile;
  liked: boolean;
  onLike: (p: Profile) => void;
}) {
  const img = profile.avatar_url ?? profile.image ?? profile.images?.[0] ?? "";
  const firstName = profile.name?.split(" ")[0] ?? "—";

  return (
    <div style={{ display: "flex", flexDirection: "column", borderRadius: 14, overflow: "hidden", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
      {/* Photo */}
      <div style={{ position: "relative", aspectRatio: "3/4", overflow: "hidden" }}>
        {img ? (
          <img
            src={img}
            alt={firstName}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 32 }}>👤</span>
          </div>
        )}

        {/* Yellow tonight badge */}
        <div style={{
          position: "absolute", top: 6, left: 6,
          background: "rgba(234,179,8,0.92)", backdropFilter: "blur(8px)",
          borderRadius: 6, padding: "2px 7px",
          fontSize: 9, fontWeight: 800, color: "#1a1000", letterSpacing: "0.05em",
        }}>
          🌙 FREE TONIGHT
        </div>

        {/* Gradient overlay */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 55%)" }} />

        {/* Name + age */}
        <div style={{ position: "absolute", bottom: 6, left: 7, right: 7 }}>
          <p style={{ color: "#fff", fontWeight: 800, fontSize: 13, margin: 0, lineHeight: 1.2, textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>
            {firstName}, {profile.age}
          </p>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 10, margin: 0 }}>
            📍 {profile.city || "Indonesia"}
          </p>
        </div>
      </div>

      {/* Like button */}
      <button
        onClick={() => onLike(profile)}
        style={{
          width: "100%", padding: "10px 0",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
          background: liked
            ? "linear-gradient(135deg, rgba(236,72,153,0.35), rgba(168,85,247,0.25))"
            : "rgba(255,255,255,0.04)",
          border: "none", cursor: "pointer",
          transition: "background 0.2s",
        }}
      >
        <Heart
          size={18}
          color={liked ? "#f472b6" : "rgba(255,255,255,0.4)"}
          fill={liked ? "#f472b6" : "none"}
          style={{ transition: "all 0.2s" }}
        />
        <span style={{ fontSize: 11, fontWeight: 700, color: liked ? "#f472b6" : "rgba(255,255,255,0.45)" }}>
          {liked ? "Invited" : "Invite"}
        </span>
      </button>
    </div>
  );
}

export default function FreeTonightSheet({
  open,
  onClose,
  currentUserId,
  currentUserCoins,
  onCoinsSpent,
}: FreeTonightSheetProps) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [requestTarget, setRequestTarget] = useState<Profile | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Load profiles who are free tonight
  useEffect(() => {
    if (!open) return;
    setLoading(true);

    supabase
      .from("profiles_public")
      .select("*")
      .eq("available_tonight", true)
      .neq("id", currentUserId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(60)
      .then(({ data }) => {
        setProfiles((data ?? []) as unknown as Profile[]);
        setLoading(false);
      });
  }, [open, currentUserId]);

  // Load already-sent requests so hearts show as liked
  useEffect(() => {
    if (!open || !currentUserId) return;
    supabase
      .from("tonight_requests")
      .select("receiver_id")
      .eq("sender_id", currentUserId)
      .in("status", ["pending", "accepted"])
      .then(({ data }) => {
        if (data) setLikedIds(new Set(data.map((r: any) => r.receiver_id)));
      });
  }, [open, currentUserId]);

  const handleLike = (profile: Profile) => {
    if (likedIds.has(profile.id)) return; // already invited
    setRequestTarget(profile);
  };

  const handleRequestSent = (profileId: string, coinsSpent: number) => {
    setLikedIds(prev => new Set([...prev, profileId]));
    onCoinsSpent(coinsSpent);
    setRequestTarget(null);
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              style={{ position: "fixed", inset: 0, zIndex: 180, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
            />

            {/* Sheet — 70% height */}
            <motion.div
              ref={sheetRef}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              style={{
                position: "fixed", bottom: 0, left: 0, right: 0,
                height: "70vh", zIndex: 181,
                background: "linear-gradient(180deg, #0d0510 0%, #0a0212 100%)",
                borderTopLeftRadius: 24, borderTopRightRadius: 24,
                border: "1px solid rgba(234,179,8,0.2)",
                borderBottom: "none",
                boxShadow: "0 -8px 48px rgba(234,179,8,0.12), 0 -2px 0 rgba(234,179,8,0.3)",
                display: "flex", flexDirection: "column", overflow: "hidden",
              }}
            >
              {/* Handle bar */}
              <div style={{ display: "flex", justifyContent: "center", paddingTop: 10, paddingBottom: 4, flexShrink: 0 }}>
                <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.15)" }} />
              </div>

              {/* Header */}
              <div style={{ padding: "8px 16px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, borderBottom: "1px solid rgba(234,179,8,0.12)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: "linear-gradient(135deg, rgba(234,179,8,0.3), rgba(251,146,60,0.2))",
                    border: "1px solid rgba(234,179,8,0.35)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Flame size={18} color="#fbbf24" />
                  </div>
                  <div>
                    <p style={{ color: "#fff", fontWeight: 900, fontSize: 16, margin: 0, lineHeight: 1.1 }}>Free Tonight</p>
                    <p style={{ color: "rgba(251,191,36,0.7)", fontSize: 10, margin: 0 }}>
                      {profiles.length > 0 ? `${profiles.length} available now` : "Looking…"}
                    </p>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {/* Coin balance */}
                  <div style={{ background: "rgba(234,179,8,0.12)", border: "1px solid rgba(234,179,8,0.25)", borderRadius: 20, padding: "4px 10px", display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ fontSize: 13 }}>🪙</span>
                    <span style={{ color: "#fbbf24", fontWeight: 800, fontSize: 13 }}>{currentUserCoins}</span>
                  </div>
                  <button
                    onClick={onClose}
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "6px 8px", cursor: "pointer", color: "rgba(255,255,255,0.6)", display: "flex" }}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Cost hint */}
              <div style={{ padding: "8px 16px 0", flexShrink: 0 }}>
                <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, margin: 0 }}>
                  🪙 3 coins to send an invite + gift cost · Invites expire at 1am
                </p>
              </div>

              {/* Grid */}
              <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px 24px" }}>
                {loading ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
                    Looking for people free tonight…
                  </div>
                ) : profiles.length === 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 10 }}>
                    <span style={{ fontSize: 40 }}>🌙</span>
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, textAlign: "center", margin: 0 }}>
                      No one is free tonight yet.<br />Check back later or turn on your own badge.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                    {profiles.map(p => (
                      <ProfileCard
                        key={p.id}
                        profile={p}
                        liked={likedIds.has(p.id)}
                        onLike={handleLike}
                      />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Tonight Request Modal */}
      <TonightRequestModal
        open={!!requestTarget}
        profile={requestTarget}
        currentUserId={currentUserId}
        currentUserCoins={currentUserCoins}
        onClose={() => setRequestTarget(null)}
        onSent={handleRequestSent}
      />
    </>
  );
}
