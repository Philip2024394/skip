import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, animate } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useCoinBalance } from "@/shared/hooks/useCoinBalance";
import { useKeyBalance } from "@/shared/hooks/useKeyBalance";

// ── Constants ──────────────────────────────────────────────────────────────────
const GOLD         = "#f59e0b";
const GOLD_DIM     = "rgba(245,158,11,0.12)";
const GOLD_BORDER  = "rgba(245,158,11,0.25)";
const CRIMSON      = "#c2185b";
const CRIMSON_GLOW = "rgba(194,24,91,0.35)";
const FROST        = "rgba(0,0,0,0.55)";
const FROST_BORDER = "rgba(255,255,255,0.10)";

// ── Coin packs (same as CoinShop) ─────────────────────────────────────────────
interface CoinPack {
  id: string; coins: number; priceIdr: number; priceUsd: number;
  label: string; tag?: string; emoji: string;
  gradient: string; accentColor: string; saving?: string;
}

const COIN_PACKS: CoinPack[] = [
  { id: "starter",  coins: 50,    priceIdr: 19_000,  priceUsd: 1.18,  label: "Starter",  emoji: "⭐", gradient: "linear-gradient(135deg,#831843,#be185d)",          accentColor: "#ec4899" },
  { id: "popular",  coins: 150,   priceIdr: 49_000,  priceUsd: 3.04,  label: "Popular",  tag: "BEST VALUE", emoji: "⚡", gradient: "linear-gradient(135deg,#7c2d12,#c2185b)", accentColor: "#f87171" },
  { id: "value",    coins: 400,   priceIdr: 99_000,  priceUsd: 6.15,  label: "Value",    saving: "Save 37%", emoji: "✨", gradient: "linear-gradient(135deg,#1e3a8a,#2563eb)", accentColor: "#60a5fa" },
  { id: "diamond",  coins: 1_000, priceIdr: 199_000, priceUsd: 12.35, label: "Diamond",  saving: "Save 48%", emoji: "💎", gradient: "linear-gradient(135deg,#78350f,#d97706)", accentColor: "#fbbf24" },
];

const COIN_USES = [
  { emoji: "💘", label: "Blind date instant unlock",  cost: 30 },
  { emoji: "🔓", label: "Share WhatsApp / contact",   cost: 20 },
  { emoji: "🚀", label: "Boost blind date 24h",       cost: 40 },
  { emoji: "💔", label: "Unlock after failed quiz",   cost: 50 },
  { emoji: "🎮", label: "Connect 4 game bet (min)",   cost: 5  },
];

function formatIdr(n: number): string {
  return "Rp " + n.toLocaleString("id-ID");
}

// ── Animated counter ──────────────────────────────────────────────────────────
function AnimatedNumber({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const prev = useRef(0);
  useEffect(() => {
    if (!ref.current) return;
    const from = prev.current;
    prev.current = value;
    const ctrl = animate(from, value, {
      duration: 0.9,
      ease: "easeOut",
      onUpdate(v) {
        if (ref.current) ref.current.textContent = Math.round(v).toLocaleString();
      },
    });
    return ctrl.stop;
  }, [value]);
  return <span ref={ref}>{value.toLocaleString()}</span>;
}

// ── Transaction helpers ────────────────────────────────────────────────────────
interface Transaction { id: string; amount: number; reason: string; created_at: string; }

function txMeta(reason: string): { label: string; emoji: string } {
  const map: Record<string, { label: string; emoji: string }> = {
    like:            { label: "Liked a profile",       emoji: "❤️" },
    award_like:      { label: "Liked a profile",       emoji: "❤️" },
    match:           { label: "New match!",             emoji: "💕" },
    connect4_win:    { label: "Won Connect 4",          emoji: "🎮" },
    connect4_loss:   { label: "Lost Connect 4",         emoji: "🎮" },
    onboarding:      { label: "Welcome bonus",          emoji: "🎁" },
    purchase:        { label: "Coin purchase",          emoji: "💳" },
    blind_date:      { label: "Blind date unlock",      emoji: "💘" },
    whatsapp:        { label: "WhatsApp unlock",        emoji: "🔓" },
    boost:           { label: "Profile boost",          emoji: "🚀" },
    referral:        { label: "Referral reward",        emoji: "🎉" },
  };
  const key = Object.keys(map).find(k => reason.toLowerCase().includes(k));
  return key ? map[key] : { label: reason.replace(/_/g, " "), emoji: "🪙" };
}

function relTime(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── Daily earn progress bar ───────────────────────────────────────────────────
function DailyEarnBar({ transactions }: { transactions: Transaction[] }) {
  const today = new Date().toDateString();
  const earned = transactions
    .filter(t => t.amount > 0 && new Date(t.created_at).toDateString() === today)
    .reduce((s, t) => s + t.amount, 0);
  const cap = 20;
  const pct = Math.min(earned / cap, 1);

  return (
    <div style={{
      background: FROST, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
      border: `1px solid ${FROST_BORDER}`, borderRadius: 20, padding: "16px 18px",
      boxShadow: "0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ fontSize: 15 }}>🌱</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(134,239,172,0.9)", letterSpacing: "0.02em" }}>Today's free earn</span>
        </div>
        <span style={{
          fontSize: 12, fontWeight: 900, color: "#4ade80",
          background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.25)",
          borderRadius: 20, padding: "2px 10px",
        }}>{Math.min(earned, cap)} / {cap} 🪙</span>
      </div>
      <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden", marginBottom: 12 }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct * 100}%` }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          style={{ height: "100%", background: "linear-gradient(90deg,#16a34a,#22c55e,#4ade80)", borderRadius: 99,
            boxShadow: "0 0 8px rgba(34,197,94,0.5)" }}
        />
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {[
          { icon: "❤️", text: "+2 per like" },
          { icon: "💕", text: "+5 per match" },
          { icon: "🎮", text: "+win bets" },
        ].map(e => (
          <div key={e.text} style={{
            fontSize: 10, color: "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", gap: 4,
            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 20, padding: "3px 9px",
          }}>
            <span>{e.icon}</span>{e.text}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
interface Props { userId: string; onClose: () => void; }

export default function CoinWalletSheet({ userId, onClose }: Props) {
  const { balance, loading, refetch } = useCoinBalance(userId);
  const keyBal                       = useKeyBalance(userId);
  const [section, setSection]       = useState<"wallet" | "buy">("wallet");
  const [transactions, setTx]       = useState<Transaction[]>([]);
  const [txLoading, setTxLoading]   = useState(true);
  const [selected, setSelected]     = useState<CoinPack | null>(null);
  const [buying, setBuying]         = useState(false);
  const [justBought, setJustBought] = useState<CoinPack | null>(null);

  // Load recent transactions
  useEffect(() => {
    async function load() {
      setTxLoading(true);
      const { data } = await (supabase as any)
        .from("coin_transactions")
        .select("id, amount, reason, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(25);
      setTx(data ?? []);
      setTxLoading(false);
    }
    load();
  }, [userId]);

  const handleBuy = async (pack: CoinPack) => {
    if (buying) return;
    setBuying(true);
    try {
      const { error } = await supabase.rpc("purchase_coins" as any, {
        p_user_id:    userId,
        p_coins:      pack.coins,
        p_price_idr:  pack.priceIdr,
        p_pack_label: pack.label,
      });
      if (error) throw error;
      await refetch();
      // Refresh transaction list
      const { data } = await (supabase as any)
        .from("coin_transactions")
        .select("id, amount, reason, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(25);
      setTx(data ?? []);
      setJustBought(pack);
      setSelected(null);
      setTimeout(() => setJustBought(null), 3500);
    } catch (err) {
      console.error("purchase_coins:", err);
    } finally {
      setBuying(false);
    }
  };

  return (
    <>
      {/* ── Backdrop ──────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.28 }}
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 9700,
          background: "rgba(0,0,0,0.78)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
        }}
      />

      {/* ── Sheet ─────────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 310, damping: 34 }}
        style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          zIndex: 9701,
          maxWidth: 480, margin: "0 auto",
          height: "90dvh",
          display: "flex", flexDirection: "column",
          backgroundImage: "url('https://ik.imagekit.io/dateme/coins.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          borderRadius: "26px 26px 0 0",
          border: "1.5px solid #c2185b",
          borderBottom: "none",
          boxShadow: "0 -32px 80px rgba(0,0,0,0.75), 0 0 60px rgba(194,24,91,0.18)",
          overflow: "hidden",
          paddingBottom: "max(0px,env(safe-area-inset-bottom,0px))",
        }}
      >
        {/* Dark overlay so content stays readable over the PNG */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 0,
          background: "rgba(0,0,0,0.72)",
          pointerEvents: "none",
        }} />

        {/* Pink shimmer line at top of sheet — matches onboarding name input #c2185b */}
        <div style={{
          height: 2, position: "relative", zIndex: 1,
          background: "linear-gradient(90deg, transparent, #c2185b, rgba(236,72,153,0.8), #c2185b, transparent)",
          flexShrink: 0,
        }} />

        {/* Handle bar */}
        <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 0", flexShrink: 0, position: "relative", zIndex: 1 }}>
          <div style={{ width: 36, height: 4, borderRadius: 99, background: "rgba(255,255,255,0.14)" }} />
        </div>

        {/* ── Header: big balance ─────────────────────────────────────────────── */}
        <div style={{
          padding: "14px 20px 18px",
          background: "linear-gradient(180deg,rgba(194,24,91,0.10) 0%,rgba(0,0,0,0.0) 100%)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          flexShrink: 0, position: "relative", zIndex: 1,
        }}>
          {/* Close */}
          <button
            onClick={onClose}
            style={{
              position: "absolute", top: 14, right: 20,
              width: 34, height: 34, borderRadius: "50%",
              background: FROST, backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
              border: `1px solid ${FROST_BORDER}`,
              color: "rgba(255,255,255,0.70)", fontSize: 16, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
            }}
            aria-label="Close"
          >✕</button>

          <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.65)", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 12 }}>
            Coin Wallet
          </p>

          {/* Balance display */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: 14 }}>
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.06 }}
              style={{
                width: 56, height: 56, borderRadius: 18,
                background: "linear-gradient(135deg,rgba(245,158,11,0.18),rgba(249,115,22,0.10))",
                border: `1px solid ${GOLD_BORDER}`,
                backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30,
                boxShadow: "0 4px 20px rgba(245,158,11,0.15)",
              }}
            >🪙</motion.div>
            <div>
              <div style={{ fontSize: 46, fontWeight: 900, color: GOLD, lineHeight: 1, letterSpacing: "-0.04em" }}>
                {loading
                  ? <span style={{ color: "rgba(245,158,11,0.35)" }}>···</span>
                  : <AnimatedNumber value={balance} />
                }
              </div>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", marginTop: 3, letterSpacing: "0.02em" }}>coins available</p>
            </div>
          </div>

          {/* Section tabs */}
          <div style={{
            display: "flex", gap: 4, marginTop: 18,
            background: FROST, backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
            borderRadius: 16, padding: "4px",
            border: `1px solid ${FROST_BORDER}`,
            boxShadow: "0 2px 12px rgba(0,0,0,0.25)",
          }}>
            {([
              { id: "wallet", label: "💼  Wallet"    },
              { id: "buy",    label: "🛒  Get Coins" },
            ] as const).map(s => (
              <motion.button
                key={s.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => setSection(s.id)}
                style={{
                  flex: 1, padding: "10px 0", borderRadius: 12, border: "none", cursor: "pointer",
                  background: section === s.id
                    ? `linear-gradient(135deg,${CRIMSON},#e91e8c)`
                    : "transparent",
                  color: section === s.id ? "#fff" : "rgba(255,255,255,0.35)",
                  fontWeight: 800, fontSize: 13, transition: "all 0.18s",
                  boxShadow: section === s.id ? `0 4px 16px ${CRIMSON_GLOW}` : "none",
                  letterSpacing: "0.01em",
                }}
              >{s.label}</motion.button>
            ))}
          </div>
        </div>

        {/* ── Scrollable body ────────────────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px 40px", WebkitOverflowScrolling: "touch", position: "relative", zIndex: 1 } as React.CSSProperties}>

          {/* ════ WALLET SECTION ═══════════════════════════════════════════════ */}
          {section === "wallet" && (
            <motion.div key="wallet" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>

              <DailyEarnBar transactions={transactions} />

              {/* Key balance card */}
              {!keyBal.loading && (
                <div style={{
                  marginTop: 12,
                  background: FROST, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
                  border: "1px solid rgba(245,158,11,0.22)", borderRadius: 20, padding: "14px 16px",
                  display: "flex", alignItems: "center", gap: 14,
                  boxShadow: "0 4px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)",
                }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                    background: "linear-gradient(135deg,rgba(245,158,11,0.2),rgba(251,191,36,0.12))",
                    border: "1px solid rgba(245,158,11,0.3)",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24,
                    boxShadow: "0 4px 16px rgba(245,158,11,0.12)",
                  }}>🗝️</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 17, fontWeight: 900, color: "#fbbf24" }}>
                        {keyBal.keys} Key{keyBal.keys !== 1 ? "s" : ""}
                      </span>
                      {keyBal.keys > 0 && (
                        <span style={{
                          fontSize: 9, fontWeight: 800, color: "#f59e0b",
                          background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)",
                          borderRadius: 20, padding: "2px 8px", letterSpacing: "0.08em",
                        }}>READY</span>
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 7 }}>
                      {[0, 1, 2].map(i => (
                        <div key={i} style={{
                          width: 20, height: 20, borderRadius: "50%", fontSize: 10,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          background: i < keyBal.fragments ? "rgba(245,158,11,0.3)" : "rgba(255,255,255,0.05)",
                          border: i < keyBal.fragments ? "1px solid rgba(245,158,11,0.55)" : "1px solid rgba(255,255,255,0.08)",
                          transition: "all 0.3s",
                          boxShadow: i < keyBal.fragments ? "0 0 6px rgba(245,158,11,0.3)" : "none",
                        }}>
                          {i < keyBal.fragments ? "🧩" : ""}
                        </div>
                      ))}
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.65)", marginLeft: 3 }}>
                        {keyBal.fragments}/3 fragments
                      </span>
                    </div>
                  </div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.65)", textAlign: "right", lineHeight: 1.6 }}>
                    Each key<br />opens 1 safe
                  </div>
                </div>
              )}

              {/* Recent activity */}
              <div style={{ marginTop: 20 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.65)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>
                  Recent Activity
                </p>

                {txLoading ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {[1,2,3].map(i => (
                      <div key={i} style={{ height: 56, borderRadius: 16, background: FROST, backdropFilter: "blur(12px)", animation: "pulse 1.8s ease-in-out infinite" }} />
                    ))}
                  </div>
                ) : transactions.length === 0 ? (
                  <div style={{
                    textAlign: "center", padding: "32px 20px",
                    background: FROST, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
                    border: `1px solid ${FROST_BORDER}`, borderRadius: 20,
                    boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
                  }}>
                    <div style={{ fontSize: 32, marginBottom: 10 }}>🕐</div>
                    <p style={{ fontSize: 14, color: "rgba(255,255,255,0.70)", fontWeight: 600 }}>No activity yet</p>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.70)", marginTop: 5 }}>Start liking profiles to earn free coins</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {transactions.map((tx, i) => {
                      const { label, emoji } = txMeta(tx.reason);
                      const earn = tx.amount > 0;
                      return (
                        <motion.div
                          key={tx.id}
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.03, duration: 0.2 }}
                          style={{
                            display: "flex", alignItems: "center", gap: 12,
                            padding: "12px 14px",
                            background: FROST, backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
                            border: `1px solid ${earn ? "rgba(34,197,94,0.14)" : "rgba(248,113,113,0.12)"}`,
                            borderRadius: 16,
                            boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
                          }}
                        >
                          <div style={{
                            width: 36, height: 36, borderRadius: 11, flexShrink: 0,
                            background: earn ? "rgba(34,197,94,0.12)" : "rgba(248,113,113,0.10)",
                            border: `1px solid ${earn ? "rgba(34,197,94,0.2)" : "rgba(248,113,113,0.18)"}`,
                            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
                          }}>{emoji}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.78)", fontWeight: 600, textTransform: "capitalize" }}>{label}</p>
                            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.70)", marginTop: 2 }}>{relTime(tx.created_at)}</p>
                          </div>
                          <div style={{
                            fontSize: 14, fontWeight: 900, color: earn ? "#4ade80" : "#f87171", flexShrink: 0,
                            background: earn ? "rgba(34,197,94,0.08)" : "rgba(248,113,113,0.08)",
                            border: `1px solid ${earn ? "rgba(34,197,94,0.18)" : "rgba(248,113,113,0.15)"}`,
                            borderRadius: 20, padding: "3px 10px",
                          }}>
                            {earn ? "+" : ""}{tx.amount} 🪙
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* What coins unlock */}
              <div style={{
                marginTop: 20,
                background: FROST, backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
                border: `1px solid ${FROST_BORDER}`, borderRadius: 20, padding: "16px 18px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
              }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.65)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14 }}>
                  🪙 What coins unlock
                </p>
                {COIN_USES.map((u, i) => (
                  <div key={u.label} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "10px 0",
                    borderBottom: i < COIN_USES.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                        background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)",
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
                      }}>{u.emoji}</div>
                      <span style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", fontWeight: 500 }}>{u.label}</span>
                    </div>
                    <div style={{
                      fontSize: 11, fontWeight: 800, color: GOLD,
                      background: GOLD_DIM, borderRadius: 20, padding: "4px 10px",
                      border: `1px solid ${GOLD_BORDER}`, whiteSpace: "nowrap",
                    }}>
                      {u.cost} 🪙
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setSection("buy")}
                style={{
                  marginTop: 18, width: "100%", padding: "17px", borderRadius: 50, border: "none",
                  background: `linear-gradient(135deg,${CRIMSON},#e91e8c)`,
                  color: "#fff", fontSize: 16, fontWeight: 900, cursor: "pointer",
                  boxShadow: `0 8px 32px ${CRIMSON_GLOW}`, letterSpacing: "-0.01em",
                }}
              >
                🛒 Get More Coins
              </motion.button>
            </motion.div>
          )}

          {/* ════ BUY SECTION ══════════════════════════════════════════════════ */}
          {section === "buy" && (
            <motion.div key="buy" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>

              {/* Success banner */}
              <AnimatePresence>
                {justBought && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                    style={{
                      marginBottom: 16, borderRadius: 20, padding: "16px 18px",
                      background: FROST, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
                      border: "1.5px solid rgba(34,197,94,0.35)",
                      display: "flex", alignItems: "center", gap: 14,
                      boxShadow: "0 4px 24px rgba(34,197,94,0.15)",
                    }}
                  >
                    <div style={{
                      width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                      background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
                    }}>🎉</div>
                    <div>
                      <p style={{ fontSize: 15, fontWeight: 800, color: "#4ade80" }}>+{justBought.coins} coins added!</p>
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 3 }}>{justBought.label} pack · {formatIdr(justBought.priceIdr)}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Pack list */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {COIN_PACKS.map((pack, i) => {
                  const isSelected = selected?.id === pack.id;
                  return (
                    <motion.button
                      key={pack.id}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.07, duration: 0.22 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setSelected(isSelected ? null : pack)}
                      style={{
                        position: "relative", overflow: "hidden",
                        display: "flex", alignItems: "stretch", gap: 0,
                        padding: 0, borderRadius: 18, cursor: "pointer",
                        border: `1.5px solid ${isSelected ? pack.accentColor : "rgba(255,255,255,0.10)"}`,
                        boxShadow: isSelected
                          ? `0 0 24px ${pack.accentColor}40, 0 6px 24px rgba(0,0,0,0.5)`
                          : "0 4px 16px rgba(0,0,0,0.4)",
                        transition: "border-color 0.18s, box-shadow 0.18s",
                        textAlign: "left", background: "transparent",
                      }}
                    >
                      {/* Left: vivid gradient slab */}
                      <div style={{
                        width: 88, flexShrink: 0,
                        background: pack.gradient,
                        display: "flex", flexDirection: "column",
                        alignItems: "center", justifyContent: "center",
                        gap: 3, padding: "18px 0",
                      }}>
                        <span style={{ fontSize: 26, lineHeight: 1 }}>{pack.emoji}</span>
                        <span style={{ fontSize: 24, fontWeight: 900, color: "#fff", lineHeight: 1, letterSpacing: "-0.03em", marginTop: 5 }}>
                          {pack.coins.toLocaleString()}
                        </span>
                        <span style={{ fontSize: 9, color: "rgba(255,255,255,0.75)", fontWeight: 700, letterSpacing: "0.1em" }}>COINS</span>
                      </div>

                      {/* Right: dark panel */}
                      <div style={{
                        flex: 1, padding: "14px 40px 14px 14px",
                        background: "rgba(10,6,20,0.82)",
                        display: "flex", flexDirection: "column", justifyContent: "center", gap: 4,
                      }}>
                        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 5 }}>
                          <span style={{ fontSize: 15, fontWeight: 800, color: "#ffffff" }}>{pack.label}</span>
                          {pack.tag && (
                            <span style={{
                              fontSize: 8, fontWeight: 800, letterSpacing: "0.08em",
                              background: pack.gradient, color: "#fff",
                              borderRadius: 20, padding: "2px 8px",
                            }}>{pack.tag}</span>
                          )}
                          {pack.saving && (
                            <span style={{
                              fontSize: 8, fontWeight: 700, color: "#4ade80",
                              background: "rgba(34,197,94,0.18)", border: "1px solid rgba(34,197,94,0.35)",
                              borderRadius: 20, padding: "2px 7px",
                            }}>{pack.saving}</span>
                          )}
                        </div>
                        <div style={{ fontSize: 17, fontWeight: 900, color: pack.accentColor, letterSpacing: "-0.01em", lineHeight: 1 }}>
                          {formatIdr(pack.priceIdr)}
                        </div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.70)" }}>
                          ~${pack.priceUsd.toFixed(2)} USD
                        </div>
                      </div>

                      {/* Selected checkmark */}
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: isSelected ? 1 : 0, opacity: isSelected ? 1 : 0 }}
                        style={{
                          position: "absolute", top: 10, right: 10,
                          width: 24, height: 24, borderRadius: "50%",
                          background: pack.gradient,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 12, color: "#fff", fontWeight: 900,
                          boxShadow: `0 2px 10px ${pack.accentColor}70`,
                        }}
                      >✓</motion.div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Buy CTA */}
              <AnimatePresence>
                {selected && (
                  <motion.div
                    initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 14 }}
                    style={{ marginTop: 14 }}
                  >
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleBuy(selected)}
                      disabled={buying}
                      style={{
                        width: "100%", padding: "17px", borderRadius: 50, border: "none",
                        background: `linear-gradient(135deg,${CRIMSON},#e91e8c)`,
                        color: "white", fontSize: 16, fontWeight: 900,
                        cursor: buying ? "not-allowed" : "pointer",
                        opacity: buying ? 0.7 : 1,
                        boxShadow: `0 8px 32px ${CRIMSON_GLOW}`,
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {buying ? "Processing…" : `Buy ${selected.coins.toLocaleString()} coins · ${formatIdr(selected.priceIdr)}`}
                    </motion.button>
                    <p style={{ fontSize: 10, color: "rgba(255,255,255,0.70)", textAlign: "center", margin: "8px 0 0" }}>
                      Coins added instantly · No subscription
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              <div style={{ marginTop: 20 }}>
                <DailyEarnBar transactions={transactions} />
              </div>
            </motion.div>
          )}

        </div>
      </motion.div>
    </>
  );
}
