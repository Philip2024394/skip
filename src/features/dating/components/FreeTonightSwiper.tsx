import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "@/shared/types/profile";

// ── Gifts ────────────────────────────────────────────────────────────────────
const GIFTS = [
  { id: "rose",      emoji: "🌹", label: "Rose",       coins: 2 },
  { id: "chocolate", emoji: "🍫", label: "Chocolates", coins: 3 },
  { id: "bouquet",   emoji: "💐", label: "Bouquet",    coins: 4 },
  { id: "teddy",     emoji: "🧸", label: "Teddy",      coins: 5 },
  { id: "champagne", emoji: "🍾", label: "Champagne",  coins: 6 },
  { id: "dinner",    emoji: "🍽️", label: "Dinner",     coins: 8 },
  { id: "ring",      emoji: "💍", label: "Ring",        coins: 10 },
];

const SUGGESTIONS = [
  "Dinner and drinks tonight — my treat 🍽️",
  "Beach walk and sunset cocktails? 🌅",
  "Movie night, you pick the film 🎬",
  "Night market and good vibes 🌙",
  "Rooftop drinks with a view 🥂",
  "Spontaneous adventure — I'll plan everything ✨",
];

const BASE_COINS = 3;

// ── Distance helper ───────────────────────────────────────────────────────────
function calcKm(lat1?: number, lon1?: number, lat2?: number, lon2?: number): number | null {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface FreeTonightSwiperProps {
  open: boolean;
  onClose: () => void;
  currentUserId: string;
  currentUserCoins: number;
  onCoinsSpent: (amount: number) => void;
  userLat?: number;
  userLng?: number;
}

// ── Main component ────────────────────────────────────────────────────────────
export default function FreeTonightSwiper({
  open,
  onClose,
  currentUserId,
  currentUserCoins,
  onCoinsSpent,
  userLat,
  userLng,
}: FreeTonightSwiperProps) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [index, setIndex] = useState(0);
  const [imgIndex, setImgIndex] = useState(0);
  const [selectedGift, setSelectedGift] = useState<typeof GIFTS[0] | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const touchStartX = useRef<number | null>(null);

  const profile = profiles[index] ?? null;
  const images: string[] = profile
    ? [profile.avatar_url ?? profile.image, ...(profile.images ?? [])].filter(Boolean) as string[]
    : [];
  const totalCoins = BASE_COINS + (selectedGift?.coins ?? 0);
  const canAfford = currentUserCoins >= totalCoins;
  const canSend = !!selectedGift && message.trim().length >= 8 && canAfford && !!profile;
  const firstName = profile?.name?.split(" ")[0] ?? "";
  const km = calcKm(userLat, userLng, profile?.latitude, profile?.longitude);
  const alreadySent = profile ? sentIds.has(profile.id) : false;

  // Load tonight profiles
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setIndex(0);
    setImgIndex(0);
    supabase
      .from("profiles_public")
      .select("*")
      .eq("available_tonight", true)
      .neq("id", currentUserId)
      .eq("is_active", true)
      .order("last_seen_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setProfiles((data ?? []) as unknown as Profile[]);
        setLoading(false);
      });
  }, [open, currentUserId]);

  // Load already-sent
  useEffect(() => {
    if (!open || !currentUserId) return;
    (supabase.from("tonight_requests") as any)
      .select("receiver_id")
      .eq("sender_id", currentUserId)
      .in("status", ["pending", "accepted"])
      .then(({ data }: any) => {
        if (data) setSentIds(new Set(data.map((r: any) => r.receiver_id)));
      });
  }, [open, currentUserId]);

  // Reset image index when profile changes
  useEffect(() => { setImgIndex(0); }, [index]);

  const nextProfile = () => {
    setIndex(i => Math.min(i + 1, profiles.length - 1));
    setSelectedGift(null);
    setMessage("");
  };

  const prevProfile = () => {
    setIndex(i => Math.max(i - 1, 0));
    setSelectedGift(null);
    setMessage("");
  };

  const nextImage = () => setImgIndex(i => Math.min(i + 1, images.length - 1));
  const prevImage = () => setImgIndex(i => Math.max(i - 1, 0));

  // Touch swipe for images
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) diff > 0 ? nextImage() : prevImage();
    touchStartX.current = null;
  };

  // 1am expiry
  const getExpiry = () => {
    const d = new Date();
    d.setHours(25, 0, 0, 0);
    return d.toISOString();
  };

  const handleSend = async () => {
    if (!profile || !canSend) return;
    setSending(true);
    try {
      const { data: newBal, error: coinErr } = await supabase.rpc("spend_coins", {
        p_user_id: currentUserId,
        p_amount: totalCoins,
        p_reason: `Free Tonight invite to ${profile.name}`,
      });
      if (coinErr || newBal === -1) throw new Error("Not enough coins");

      const { error: reqErr } = await (supabase.from("tonight_requests") as any).insert({
        sender_id: currentUserId,
        receiver_id: profile.id,
        gift_id: selectedGift!.id,
        gift_label: selectedGift!.label,
        gift_cost_coins: selectedGift!.coins,
        coins_spent: totalCoins,
        message: message.trim(),
        expires_at: getExpiry(),
      });
      if (reqErr) throw new Error(reqErr.message);

      toast.success(`Invite sent to ${firstName}! 🌙`);
      setSentIds(prev => new Set([...prev, profile.id]));
      onCoinsSpent(totalCoins);
      setSelectedGift(null);
      setMessage("");
      // Auto advance to next profile after short delay
      setTimeout(() => nextProfile(), 800);
    } catch (e: any) {
      toast.error(e.message ?? "Something went wrong");
    } finally {
      setSending(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: "fixed", inset: 0, zIndex: 180, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
            style={{
              position: "fixed", bottom: 0, left: 0, right: 0,
              height: "92vh", zIndex: 181,
              background: "#08020e",
              borderTopLeftRadius: 24, borderTopRightRadius: 24,
              border: "1px solid rgba(234,179,8,0.25)",
              borderBottom: "none",
              boxShadow: "0 -8px 48px rgba(234,179,8,0.1), 0 -2px 0 rgba(234,179,8,0.35)",
              display: "flex", flexDirection: "column", overflow: "hidden",
            }}
          >
            {/* Top accent */}
            <div style={{ height: 3, background: "linear-gradient(90deg, #f59e0b, #ec4899, #a855f7, #ec4899, #f59e0b)", flexShrink: 0 }} />

            {/* Header bar */}
            <div style={{ padding: "10px 16px 8px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 18 }}>🌙</span>
                <div>
                  <p style={{ color: "#fff", fontWeight: 900, fontSize: 15, margin: 0, lineHeight: 1 }}>Free Tonight</p>
                  <p style={{ color: "rgba(251,191,36,0.65)", fontSize: 10, margin: 0 }}>
                    {loading ? "Looking…" : profiles.length > 0 ? `${index + 1} of ${profiles.length}` : "No one available"}
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {/* Coin balance */}
                <div style={{ background: "rgba(234,179,8,0.12)", border: "1px solid rgba(234,179,8,0.3)", borderRadius: 20, padding: "4px 10px", display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: 12 }}>🪙</span>
                  <span style={{ color: "#fbbf24", fontWeight: 800, fontSize: 13 }}>{currentUserCoins}</span>
                </div>
                <button onClick={onClose} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "6px 8px", cursor: "pointer", color: "rgba(255,255,255,0.6)", display: "flex", alignItems: "center" }}>
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* ── Content ── */}
            {loading ? (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
                Finding people free tonight…
              </div>
            ) : profiles.length === 0 ? (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: 24 }}>
                <span style={{ fontSize: 48 }}>🌙</span>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, textAlign: "center", margin: 0, lineHeight: 1.6 }}>
                  No one is free tonight yet.<br />Check back later tonight.
                </p>
              </div>
            ) : profile ? (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

                {/* ── Photo card ── */}
                <div
                  style={{ position: "relative", flex: "0 0 48%", overflow: "hidden", cursor: "pointer" }}
                  onTouchStart={onTouchStart}
                  onTouchEnd={onTouchEnd}
                >
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={`${profile.id}-${imgIndex}`}
                      src={images[imgIndex]}
                      alt={firstName}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.18 }}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                  </AnimatePresence>

                  {/* Tap zones for image nav */}
                  {imgIndex > 0 && (
                    <button onClick={prevImage} style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "30%", background: "transparent", border: "none", cursor: "pointer" }} />
                  )}
                  {imgIndex < images.length - 1 && (
                    <button onClick={nextImage} style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "30%", background: "transparent", border: "none", cursor: "pointer" }} />
                  )}

                  {/* Tonight badge */}
                  <div style={{ position: "absolute", top: 10, left: 10, background: "rgba(234,179,8,0.92)", borderRadius: 8, padding: "3px 9px", fontSize: 10, fontWeight: 900, color: "#1a1000", letterSpacing: "0.04em" }}>
                    🌙 FREE TONIGHT
                  </div>

                  {/* Image dots */}
                  {images.length > 1 && (
                    <div style={{ position: "absolute", top: 10, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 4 }}>
                      {images.map((_, i) => (
                        <div key={i} style={{ width: i === imgIndex ? 16 : 5, height: 5, borderRadius: 3, background: i === imgIndex ? "#fff" : "rgba(255,255,255,0.4)", transition: "all 0.2s" }} />
                      ))}
                    </div>
                  )}

                  {/* Gradient overlay */}
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(8,2,14,0.95) 0%, rgba(8,2,14,0.2) 50%, transparent 100%)" }} />

                  {/* Name / age / location */}
                  <div style={{ position: "absolute", bottom: 10, left: 14, right: 14 }}>
                    <p style={{ color: "#fff", fontWeight: 900, fontSize: 22, margin: "0 0 2px", textShadow: "0 2px 8px rgba(0,0,0,0.8)", lineHeight: 1.1 }}>
                      {firstName}, {profile.age}
                    </p>
                    <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, margin: 0, display: "flex", alignItems: "center", gap: 4 }}>
                      📍 {profile.city || "Indonesia"}
                      {km !== null && (
                        <span style={{ color: "rgba(251,191,36,0.85)", fontWeight: 700 }}>
                          · {km < 1 ? "<1km" : `${Math.round(km)}km`} away
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Already sent overlay */}
                  {alreadySent && (
                    <div style={{ position: "absolute", inset: 0, background: "rgba(8,2,14,0.75)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <div style={{ textAlign: "center" }}>
                        <span style={{ fontSize: 36 }}>✅</span>
                        <p style={{ color: "#fff", fontWeight: 800, fontSize: 14, margin: "8px 0 0" }}>Invite sent!</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Action area ── */}
                <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px 8px" }}>

                  {!alreadySent ? (
                    <>
                      {/* Gift row */}
                      <p style={{ color: "rgba(251,191,36,0.7)", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 8px" }}>
                        Send a gift to get her attention
                      </p>
                      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4, marginBottom: 10 }}>
                        {GIFTS.map(g => (
                          <button
                            key={g.id}
                            onClick={() => setSelectedGift(selectedGift?.id === g.id ? null : g)}
                            style={{
                              flexShrink: 0, padding: "8px 10px",
                              borderRadius: 12,
                              border: selectedGift?.id === g.id ? "1.5px solid rgba(251,191,36,0.8)" : "1px solid rgba(255,255,255,0.1)",
                              background: selectedGift?.id === g.id ? "rgba(234,179,8,0.18)" : "rgba(255,255,255,0.05)",
                              cursor: "pointer", textAlign: "center",
                              transition: "all 0.15s",
                              minWidth: 52,
                            }}
                          >
                            <div style={{ fontSize: 20 }}>{g.emoji}</div>
                            <div style={{ color: selectedGift?.id === g.id ? "#fbbf24" : "rgba(255,255,255,0.4)", fontSize: 9, fontWeight: 700, marginTop: 2 }}>🪙{g.coins}</div>
                          </button>
                        ))}
                      </div>

                      {/* Tonight plan */}
                      <p style={{ color: "rgba(251,191,36,0.7)", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 6px" }}>
                        What's your plan for tonight?
                      </p>
                      <textarea
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        maxLength={180}
                        rows={2}
                        placeholder={`Tell ${firstName} your idea — be specific and genuine…`}
                        style={{
                          width: "100%", boxSizing: "border-box",
                          background: "rgba(255,255,255,0.05)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: 12, padding: "10px 12px",
                          color: "#fff", fontSize: 13, lineHeight: 1.5,
                          resize: "none", outline: "none", fontFamily: "inherit",
                          marginBottom: 6,
                        }}
                      />

                      {/* Suggestion chips */}
                      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10 }}>
                        {SUGGESTIONS.map((s, i) => (
                          <button
                            key={i}
                            onClick={() => setMessage(s)}
                            style={{
                              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
                              borderRadius: 20, padding: "3px 9px",
                              color: "rgba(255,255,255,0.4)", fontSize: 10, cursor: "pointer", fontFamily: "inherit",
                            }}
                          >
                            {s.slice(0, 26)}…
                          </button>
                        ))}
                      </div>

                      {/* Not enough coins warning */}
                      {selectedGift && !canAfford && (
                        <p style={{ color: "rgba(239,68,68,0.85)", fontSize: 11, fontWeight: 700, margin: "0 0 8px" }}>
                          ⚠️ Need 🪙{totalCoins} — you have 🪙{currentUserCoins}
                        </p>
                      )}
                    </>
                  ) : (
                    <div style={{ padding: "16px 0", textAlign: "center" }}>
                      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, margin: 0 }}>
                        Waiting for {firstName} to respond…
                      </p>
                    </div>
                  )}
                </div>

                {/* ── Bottom navigation + send ── */}
                <div style={{ padding: "8px 14px 20px", flexShrink: 0, display: "flex", gap: 8, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  {/* Prev */}
                  <button
                    onClick={prevProfile}
                    disabled={index === 0}
                    style={{
                      width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                      background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                      color: index === 0 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.6)",
                      cursor: index === 0 ? "not-allowed" : "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <ChevronLeft size={18} />
                  </button>

                  {/* Send / Skip */}
                  {alreadySent ? (
                    <button
                      onClick={nextProfile}
                      style={{
                        flex: 1, height: 44, borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)",
                        background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)",
                        fontWeight: 700, fontSize: 14, cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      }}
                    >
                      Next <ChevronRight size={16} />
                    </button>
                  ) : (
                    <button
                      onClick={canSend ? handleSend : nextProfile}
                      disabled={sending}
                      style={{
                        flex: 1, height: 44, borderRadius: 12, border: "none",
                        background: canSend
                          ? "linear-gradient(135deg, #f59e0b, #ec4899)"
                          : "rgba(255,255,255,0.07)",
                        color: canSend ? "#fff" : "rgba(255,255,255,0.4)",
                        fontWeight: 900, fontSize: 14,
                        cursor: sending ? "not-allowed" : "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                        boxShadow: canSend ? "0 4px 20px rgba(245,158,11,0.3)" : "none",
                        transition: "all 0.2s",
                      }}
                    >
                      {sending ? "Sending…" : canSend ? (
                        <><Send size={15} /> Send Invite · 🪙{totalCoins}</>
                      ) : (
                        <>Skip <ChevronRight size={16} /></>
                      )}
                    </button>
                  )}

                  {/* Next */}
                  <button
                    onClick={nextProfile}
                    disabled={index === profiles.length - 1}
                    style={{
                      width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                      background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                      color: index === profiles.length - 1 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.6)",
                      cursor: index === profiles.length - 1 ? "not-allowed" : "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>

              </div>
            ) : null}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
