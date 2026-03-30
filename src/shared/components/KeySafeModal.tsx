import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Key, Coins, Puzzle, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCoinBalance } from "@/shared/hooks/useCoinBalance";

// ── Constants ──────────────────────────────────────────────────────────────────
const TEDDY_URL =
  "https://ik.imagekit.io/dateme/Teddy%20bear%20in%20a%20cozy%20office.png?updatedAt=1774818471382";

const FLOAT_ICONS = [
  { icon: "💬", label: "WhatsApp",  delay: 0.15, x: -44, size: 36 },
  { icon: "📸", label: "Instagram", delay: 0.30, x:  28, size: 30 },
  { icon: "✈️", label: "Telegram",  delay: 0.22, x:  -8, size: 34 },
  { icon: "📱", label: "Phone",     delay: 0.42, x:  52, size: 28 },
  { icon: "🔗", label: "Connect",   delay: 0.52, x: -60, size: 26 },
];

type Screen = "loading" | "no_key" | "has_key" | "opening" | "revealed";

// ── Props ──────────────────────────────────────────────────────────────────────
interface Props {
  profile: { id: string; name: string; photos?: string[]; avatar_url?: string };
  userId: string;
  onClose: () => void;
  /** Called when user chooses the direct-payment path (existing Stripe flow). */
  onBuyKey: () => void;
}

// ── Safe SVG illustration ──────────────────────────────────────────────────────
function SafeBody({ isOpen, isGlowing }: { isOpen: boolean; isGlowing?: boolean }) {
  return (
    <div className="relative select-none" style={{ width: 180, height: 200, perspective: "700px" }}>
      {/* Back wall (teddy revealed after door opens) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.7, ease: "easeOut" }}
            className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-2xl"
            style={{ background: "rgba(30,10,40,0.95)" }}
          >
            <img
              src={TEDDY_URL}
              alt="Teddy"
              className="w-full h-full object-cover opacity-90"
              style={{ borderRadius: 14 }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Safe body (outer frame) */}
      <div
        className="absolute inset-0 rounded-2xl"
        style={{
          background: isGlowing
            ? "linear-gradient(135deg, #1a1a2e, #16213e)"
            : "linear-gradient(135deg, #111120, #1a1a2e)",
          border: isGlowing
            ? "2px solid rgba(250,200,60,0.55)"
            : "2px solid rgba(80,80,120,0.5)",
          boxShadow: isGlowing
            ? "0 0 30px rgba(250,200,60,0.25), inset 0 0 20px rgba(0,0,0,0.5)"
            : "0 8px 32px rgba(0,0,0,0.6), inset 0 0 20px rgba(0,0,0,0.5)",
        }}
      />

      {/* Hinges (left side) */}
      {[28, 150].map((top) => (
        <div
          key={top}
          className="absolute left-0 rounded-r-md"
          style={{
            top,
            width: 14,
            height: 22,
            background: "linear-gradient(135deg, #888, #444)",
            border: "1px solid #333",
          }}
        />
      ))}

      {/* Safe door (rotates open) */}
      <motion.div
        className="absolute rounded-xl overflow-hidden"
        style={{
          left: 12,
          top: 12,
          width: 156,
          height: 176,
          transformOrigin: "left center",
          transformStyle: "preserve-3d",
        }}
        animate={{ rotateY: isOpen ? -118 : 0 }}
        transition={{ duration: 1.4, ease: [0.36, 0.07, 0.19, 0.97] }}
      >
        {/* Door face */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-3"
          style={{
            background: "linear-gradient(160deg, #2a2a45 0%, #1a1a30 60%, #141420 100%)",
            border: "1.5px solid rgba(100,100,160,0.4)",
            borderRadius: 10,
            backfaceVisibility: "hidden",
          }}
        >
          {/* Dial ring */}
          <div
            className="flex items-center justify-center rounded-full"
            style={{
              width: 72,
              height: 72,
              background: "radial-gradient(circle at 38% 35%, #4a4a6a, #1e1e30)",
              border: "3px solid rgba(140,140,200,0.35)",
              boxShadow: "0 0 18px rgba(0,0,0,0.7), inset 0 0 10px rgba(0,0,0,0.5)",
            }}
          >
            {/* Inner dial */}
            <div
              className="flex items-center justify-center rounded-full"
              style={{
                width: 44,
                height: 44,
                background: "radial-gradient(circle at 38% 35%, #5a5a80, #2a2a44)",
                border: "2px solid rgba(160,160,220,0.3)",
              }}
            >
              <span className="text-2xl leading-none">🔒</span>
            </div>
          </div>

          {/* Handle bar */}
          <div
            className="rounded-full"
            style={{
              width: 48,
              height: 12,
              background: "linear-gradient(135deg, #666, #333)",
              border: "1px solid rgba(100,100,140,0.4)",
            }}
          />

          {/* Bolt indicators */}
          <div className="flex gap-8 mt-1">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="rounded-full"
                style={{
                  width: 10,
                  height: 10,
                  background: "radial-gradient(circle, #888, #444)",
                  border: "1px solid #333",
                }}
              />
            ))}
          </div>
        </div>

        {/* Door back face (visible when open from behind) */}
        <div
          className="absolute inset-0 rounded-xl"
          style={{
            background: "#0d0d18",
            transform: "rotateY(180deg)",
            backfaceVisibility: "hidden",
          }}
        />
      </motion.div>

      {/* Glow aura when has key */}
      {isGlowing && !isOpen && (
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          style={{
            boxShadow: "0 0 40px rgba(250,200,60,0.4), 0 0 80px rgba(250,200,60,0.15)",
          }}
        />
      )}
    </div>
  );
}

// ── Fragment dots ──────────────────────────────────────────────────────────────
function FragmentDots({ count }: { count: number }) {
  return (
    <div className="flex gap-2">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          initial={{ scale: 0.8 }}
          animate={{ scale: i < count ? 1.1 : 0.8, opacity: i < count ? 1 : 0.35 }}
          transition={{ type: "spring", stiffness: 300, damping: 18 }}
          className="w-5 h-5 rounded-full flex items-center justify-center text-xs"
          style={{
            background: i < count
              ? "linear-gradient(135deg, #f59e0b, #d97706)"
              : "rgba(80,80,100,0.4)",
            border: i < count
              ? "1px solid rgba(245,158,11,0.6)"
              : "1px solid rgba(80,80,100,0.3)",
          }}
        >
          {i < count ? "🧩" : ""}
        </motion.div>
      ))}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function KeySafeModal({ profile, userId, onClose, onBuyKey }: Props) {
  const [screen, setScreen] = useState<Screen>("loading");
  const [keyBalance, setKeyBalance] = useState(0);
  const [fragments, setFragments] = useState(0);
  const [contact, setContact] = useState<{ name: string; whatsapp: string } | null>(null);
  const [converting, setConverting] = useState(false);
  const [convertError, setConvertError] = useState<string | null>(null);
  const [unlocking, setUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const coinBal = useCoinBalance(userId);

  const avatarSrc = profile.photos?.[0] ?? profile.avatar_url;

  // Fetch key balance on mount
  useEffect(() => {
    const load = async () => {
      const { data } = await (supabase.from("profiles").select("key_fragments, keys_balance") as any)
        .eq("id", userId)
        .single();
      if (data) {
        setKeyBalance(data.keys_balance ?? 0);
        setFragments(data.key_fragments ?? 0);
        setScreen(data.keys_balance > 0 ? "has_key" : "no_key");
      } else {
        setScreen("no_key");
      }
    };
    load();
  }, [userId]);

  const handleConvertCoins = async () => {
    if (coinBal.balance < 500 || converting) return;
    setConverting(true);
    setConvertError(null);
    const { data } = await (supabase.rpc as any)("convert_coins_to_key", { p_user_id: userId });
    setConverting(false);
    if (typeof data === "number" && data >= 0) {
      setKeyBalance(data);
      setScreen("has_key");
    } else {
      setConvertError("Conversion failed — check your coin balance.");
    }
  };

  const handleUseKey = async () => {
    if (unlocking) return;
    setUnlocking(true);
    setUnlockError(null);
    const { data } = await (supabase.rpc as any)("unlock_with_key", {
      p_user_id: userId,
      p_target_id: profile.id,
    });
    setUnlocking(false);
    if (data?.success) {
      setContact({ name: data.name || profile.name, whatsapp: data.whatsapp || "" });
      setScreen("opening");
      // Auto-advance to revealed after the animation finishes
      setTimeout(() => setScreen("revealed"), 3800);
    } else {
      setUnlockError(data?.error || "Could not unlock — please try again.");
    }
  };

  const openContact = () => {
    if (!contact?.whatsapp) return;
    const cleaned = contact.whatsapp.replace(/\D/g, "");
    const msg = encodeURIComponent(
      `Hi ${contact.name}! 👋 I just unlocked your contact on 2DateMe — excited to connect!`
    );
    window.open(`https://wa.me/${cleaned}?text=${msg}`, "_blank");
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9998] bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 340, damping: 38 }}
        className="fixed inset-x-0 bottom-0 z-[9999] mx-auto max-w-md rounded-t-3xl overflow-hidden"
        style={{
          backgroundImage: "url('/images/app-background.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          border: "1.5px solid #c2185b",
          borderBottom: "none",
          boxShadow: "0 -32px 80px rgba(0,0,0,0.75), 0 0 60px rgba(194,24,91,0.18)",
          maxHeight: "92dvh",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Dark overlay */}
        <div
          style={{
            position: "absolute", inset: 0, zIndex: 0,
            background: "rgba(6,4,10,0.86)",
            pointerEvents: "none",
          }}
        />

        {/* Shimmer rim */}
        <div
          style={{
            position: "absolute", top: 0, left: 0, right: 0,
            height: 2, zIndex: 2,
            background: "linear-gradient(90deg, transparent, #c2185b, rgba(236,72,153,0.8), #c2185b, transparent)",
          }}
        />

        {/* Content */}
        <div style={{ position: "relative", zIndex: 1 }} className="flex flex-col">
          {/* Handle */}
          <div className="flex items-center justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-white/20" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 pb-3">
            <div className="flex items-center gap-3">
              {avatarSrc && (
                <img
                  src={avatarSrc}
                  alt={profile.name}
                  className="w-9 h-9 rounded-full object-cover border border-white/10"
                />
              )}
              <div>
                <p className="text-white font-bold text-sm leading-tight">{profile.name}</p>
                <p className="text-white/45 text-[11px]">Contact unlock</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="overflow-y-auto" style={{ maxHeight: "78dvh" }}>
            <AnimatePresence mode="wait">

              {/* ── Loading ── */}
              {screen === "loading" && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex items-center justify-center py-16"
                >
                  <div className="w-8 h-8 rounded-full border-2 border-pink-500/40 border-t-pink-500 animate-spin" />
                </motion.div>
              )}

              {/* ── No Key ── */}
              {screen === "no_key" && (
                <motion.div
                  key="no_key"
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="px-5 pb-6 space-y-5"
                >
                  {/* Safe + label */}
                  <div className="flex flex-col items-center gap-3 py-2">
                    <SafeBody isOpen={false} />
                    <p className="text-white/55 text-sm">
                      You need a <span className="text-amber-400 font-bold">🗝️ Key</span> to open the safe
                    </p>
                  </div>

                  {/* Path 1: Buy key (Stripe payment) */}
                  <div
                    className="rounded-2xl p-4 space-y-2"
                    style={{
                      background: "rgba(194,24,91,0.12)",
                      border: "1px solid rgba(194,24,91,0.3)",
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-pink-400" />
                      <p className="text-white font-bold text-sm">Buy a Key</p>
                      <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-400 font-bold border border-pink-500/30">
                        Rp 15.000
                      </span>
                    </div>
                    <p className="text-white/45 text-xs leading-relaxed">
                      Purchase a key directly and use it on any profile. One key = one safe unlocked.
                    </p>
                    <button
                      onClick={() => { onClose(); onBuyKey(); }}
                      className="w-full py-2.5 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90 active:scale-[0.98]"
                      style={{
                        background: "linear-gradient(135deg, #c2185b, #ec4899)",
                        boxShadow: "0 0 16px rgba(194,24,91,0.35)",
                      }}
                    >
                      Buy Key — Rp 15.000
                    </button>
                  </div>

                  {/* Path 2: Collect fragments */}
                  <div
                    className="rounded-2xl p-4 space-y-3"
                    style={{
                      background: "rgba(245,158,11,0.08)",
                      border: "1px solid rgba(245,158,11,0.22)",
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Puzzle className="w-4 h-4 text-amber-400" />
                      <p className="text-white font-bold text-sm">Collect 3 Fragments</p>
                      <span className="ml-auto text-xs text-amber-400/70 font-semibold">{fragments}/3</span>
                    </div>
                    <FragmentDots count={fragments} />

                    {/* Progress bar */}
                    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: "linear-gradient(90deg, #f59e0b, #d97706)" }}
                        initial={{ width: 0 }}
                        animate={{ width: `${(fragments / 3) * 100}%` }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                      />
                    </div>
                    <p className="text-white/40 text-[11px] leading-relaxed">
                      Earn fragments by <strong className="text-white/60">winning Connect 4 with a bet</strong>,
                      getting a new match, or completing daily activities.
                      Collect all 3 and they auto-combine into 1 key. 🧩
                    </p>
                  </div>

                  {/* Path 3: Convert 500 coins */}
                  <div
                    className="rounded-2xl p-4 space-y-2"
                    style={{
                      background: "rgba(99,102,241,0.08)",
                      border: "1px solid rgba(99,102,241,0.22)",
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Coins className="w-4 h-4 text-indigo-400" />
                      <p className="text-white font-bold text-sm">Convert 500 Coins</p>
                      <span
                        className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          background: coinBal.balance >= 500
                            ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.06)",
                          border: coinBal.balance >= 500
                            ? "1px solid rgba(99,102,241,0.35)" : "1px solid rgba(255,255,255,0.1)",
                          color: coinBal.balance >= 500 ? "#818cf8" : "rgba(255,255,255,0.35)",
                        }}
                      >
                        {coinBal.balance} 🪙
                      </span>
                    </div>
                    <p className="text-white/40 text-[11px]">
                      Cash in 500 coins to receive 1 key instantly. No payment needed.
                    </p>
                    {convertError && (
                      <p className="text-red-400 text-[11px]">{convertError}</p>
                    )}
                    <button
                      onClick={handleConvertCoins}
                      disabled={coinBal.balance < 500 || converting}
                      className="w-full py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{
                        background: coinBal.balance >= 500
                          ? "linear-gradient(135deg, #6366f1, #4f46e5)"
                          : "rgba(80,80,100,0.3)",
                        color: "white",
                        boxShadow: coinBal.balance >= 500
                          ? "0 0 16px rgba(99,102,241,0.3)" : "none",
                      }}
                    >
                      {converting
                        ? "Converting…"
                        : coinBal.balance >= 500
                          ? "Convert 500 Coins → 1 Key"
                          : `Need ${500 - coinBal.balance} more coins`}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ── Has Key ── */}
              {screen === "has_key" && (
                <motion.div
                  key="has_key"
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="px-5 pb-6 flex flex-col items-center gap-5"
                >
                  {/* Key badge */}
                  <motion.div
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="flex items-center gap-2 px-4 py-2 rounded-full"
                    style={{
                      background: "rgba(245,158,11,0.18)",
                      border: "1px solid rgba(245,158,11,0.4)",
                      boxShadow: "0 0 20px rgba(245,158,11,0.2)",
                    }}
                  >
                    <span className="text-lg">🗝️</span>
                    <span className="text-amber-400 font-black text-sm">
                      {keyBalance} Key{keyBalance !== 1 ? "s" : ""} available
                    </span>
                  </motion.div>

                  {/* Safe glowing */}
                  <SafeBody isOpen={false} isGlowing />

                  <div className="text-center space-y-1">
                    <p className="text-white font-bold text-base">You're ready to unlock!</p>
                    <p className="text-white/45 text-xs">
                      Use 1 key to open {profile.name}'s safe and reveal their contact details.
                    </p>
                  </div>

                  {unlockError && (
                    <p className="text-red-400 text-xs text-center">{unlockError}</p>
                  )}

                  <button
                    onClick={handleUseKey}
                    disabled={unlocking}
                    className="w-full py-4 rounded-2xl font-black text-white text-base transition-all active:scale-[0.97] disabled:opacity-60"
                    style={{
                      background: "linear-gradient(135deg, #f59e0b, #d97706, #f59e0b)",
                      backgroundSize: "200% 100%",
                      boxShadow: "0 0 32px rgba(245,158,11,0.45), 0 4px 16px rgba(0,0,0,0.4)",
                    }}
                  >
                    {unlocking ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                        Opening…
                      </span>
                    ) : (
                      "🗝️ Use Key to Open Safe"
                    )}
                  </button>

                  <button
                    onClick={() => setScreen("no_key")}
                    className="text-white/30 text-xs hover:text-white/60 transition-colors"
                  >
                    Or get more keys
                  </button>
                </motion.div>
              )}

              {/* ── Opening Animation ── */}
              {screen === "opening" && (
                <motion.div
                  key="opening"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="px-5 pb-10 flex flex-col items-center gap-4"
                >
                  <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-amber-400 font-black text-lg tracking-wide"
                  >
                    🗝️ Opening Safe…
                  </motion.p>

                  {/* Safe animation stage */}
                  <div className="relative flex items-center justify-center" style={{ height: 280, width: 220 }}>
                    <SafeBody isOpen />

                    {/* Floating social icons */}
                    {FLOAT_ICONS.map((fi, idx) => (
                      <motion.div
                        key={idx}
                        className="absolute flex flex-col items-center pointer-events-none"
                        style={{ bottom: 60, left: "50%", marginLeft: fi.x }}
                        initial={{ opacity: 0, y: 0 }}
                        animate={{ opacity: [0, 1, 1, 0], y: [-10, -90, -130, -180] }}
                        transition={{
                          delay: 1.2 + fi.delay,
                          duration: 1.8,
                          ease: "easeOut",
                        }}
                      >
                        <span style={{ fontSize: fi.size }}>{fi.icon}</span>
                      </motion.div>
                    ))}
                  </div>

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                    className="text-white/50 text-sm text-center"
                  >
                    Contact details are being revealed…
                  </motion.p>

                  {/* Pulsing dots */}
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 rounded-full bg-amber-500/60"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.25 }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ── Revealed ── */}
              {screen === "revealed" && (
                <motion.div
                  key="revealed"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: "spring", stiffness: 280, damping: 24 }}
                  className="px-5 pb-8 flex flex-col items-center gap-4"
                >
                  {/* Success icon */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 360, damping: 22, delay: 0.1 }}
                    className="w-20 h-20 rounded-full flex items-center justify-center"
                    style={{
                      background: "linear-gradient(135deg, #c2185b, #ec4899)",
                      boxShadow: "0 0 40px rgba(194,24,91,0.5)",
                    }}
                  >
                    <Check className="w-10 h-10 text-white" strokeWidth={3} />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="text-center space-y-1"
                  >
                    <p className="text-white font-black text-xl">Safe Opened! 🎉</p>
                    <p className="text-white/55 text-sm">
                      You've unlocked a connection with{" "}
                      <span className="text-pink-400 font-bold">{contact?.name ?? profile.name}</span>
                    </p>
                  </motion.div>

                  {/* Contact card */}
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="w-full rounded-2xl px-4 py-3 text-center space-y-1"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    <p className="text-white/40 text-[10px] uppercase tracking-wider">💬 WhatsApp</p>
                    <p className="text-white font-mono font-semibold text-lg">
                      {contact?.whatsapp || "—"}
                    </p>
                  </motion.div>

                  {/* CTA buttons */}
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.55 }}
                    className="w-full space-y-2"
                  >
                    {contact?.whatsapp && (
                      <button
                        onClick={openContact}
                        className="w-full py-3.5 rounded-2xl font-black text-white text-base transition-all hover:opacity-90 active:scale-[0.98]"
                        style={{
                          background: "linear-gradient(135deg, #25D366, #128C7E)",
                          boxShadow: "0 0 24px rgba(37,211,102,0.35)",
                        }}
                      >
                        💬 Open WhatsApp
                      </button>
                    )}
                    <button
                      onClick={onClose}
                      className="w-full py-3 rounded-2xl text-white/50 text-sm font-semibold border border-white/10 hover:text-white hover:border-white/20 transition-all"
                    >
                      Back to Browsing
                    </button>
                  </motion.div>

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="text-white/25 text-[10px] text-center leading-relaxed"
                  >
                    💭 Be patient — great connections take a little warmth. 🌸
                  </motion.p>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </>
  );
}
