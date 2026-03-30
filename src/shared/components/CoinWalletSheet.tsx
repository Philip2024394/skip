import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, animate } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useCoinBalance } from "@/shared/hooks/useCoinBalance";

// ── Constants ──────────────────────────────────────────────────────────────────
const GOLD         = "#f59e0b";
const GOLD_DIM     = "rgba(245,158,11,0.12)";
const GOLD_BORDER  = "rgba(245,158,11,0.25)";

// ── Coin packs (same as CoinShop) ─────────────────────────────────────────────
interface CoinPack {
  id: string; coins: number; priceIdr: number; priceUsd: number;
  label: string; tag?: string; emoji: string;
  gradient: string; accentColor: string; saving?: string;
}

const COIN_PACKS: CoinPack[] = [
  { id: "starter",  coins: 50,    priceIdr: 19_000,  priceUsd: 1.18,  label: "Starter",  emoji: "⭐", gradient: "linear-gradient(135deg,rgba(236,72,153,0.18),rgba(168,85,247,0.12))", accentColor: "#ec4899" },
  { id: "popular",  coins: 150,   priceIdr: 49_000,  priceUsd: 3.04,  label: "Popular",  tag: "BEST VALUE", emoji: "⚡", gradient: "linear-gradient(135deg,rgba(194,24,91,0.22),rgba(236,72,153,0.14))", accentColor: "#c2185b" },
  { id: "value",    coins: 400,   priceIdr: 99_000,  priceUsd: 6.15,  label: "Value",    saving: "Save 37%", emoji: "✨", gradient: "linear-gradient(135deg,rgba(59,130,246,0.18),rgba(99,102,241,0.12))", accentColor: "#3b82f6" },
  { id: "diamond",  coins: 1_000, priceIdr: 199_000, priceUsd: 12.35, label: "Diamond",  saving: "Save 48%", emoji: "💎", gradient: "linear-gradient(135deg,rgba(245,158,11,0.22),rgba(249,115,22,0.14))", accentColor: "#f59e0b" },
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
      background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.18)",
      borderRadius: 16, padding: "14px 16px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(134,239,172,0.85)" }}>Today's free earn</span>
        <span style={{ fontSize: 12, fontWeight: 900, color: "#4ade80" }}>{Math.min(earned, cap)} / {cap} 🪙</span>
      </div>
      {/* Progress bar */}
      <div style={{ height: 7, background: "rgba(255,255,255,0.07)", borderRadius: 99, overflow: "hidden" }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct * 100}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{ height: "100%", background: "linear-gradient(90deg,#22c55e,#4ade80)", borderRadius: 99 }}
        />
      </div>
      {/* Earn methods */}
      <div style={{ display: "flex", gap: 14, marginTop: 10, flexWrap: "wrap" }}>
        {[
          { icon: "❤️", text: "+2 per like" },
          { icon: "💕", text: "+5 per match" },
          { icon: "🎮", text: "+win bets" },
        ].map(e => (
          <div key={e.text} style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", display: "flex", alignItems: "center", gap: 5 }}>
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
          background: "#08060a",
          borderRadius: "26px 26px 0 0",
          border: "1.5px solid rgba(245,158,11,0.2)",
          borderBottom: "none",
          boxShadow: "0 -32px 80px rgba(0,0,0,0.75), 0 0 100px rgba(245,158,11,0.05)",
          overflow: "hidden",
          paddingBottom: "max(0px,env(safe-area-inset-bottom,0px))",
        }}
      >
        {/* Gold shimmer line at top of sheet */}
        <div style={{
          height: 2,
          background: "linear-gradient(90deg, transparent, rgba(245,158,11,0.6), transparent)",
          flexShrink: 0,
        }} />

        {/* Handle bar */}
        <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 0", flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 99, background: "rgba(255,255,255,0.14)" }} />
        </div>

        {/* ── Header: big balance ─────────────────────────────────────────────── */}
        <div style={{
          padding: "14px 20px 16px",
          background: "linear-gradient(180deg,rgba(245,158,11,0.08) 0%,transparent 100%)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          flexShrink: 0,
          position: "relative",
        }}>
          {/* Close */}
          <button
            onClick={onClose}
            style={{
              position: "absolute", top: 14, right: 20,
              width: 32, height: 32, borderRadius: "50%",
              background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.5)", fontSize: 16, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
            aria-label="Close"
          >✕</button>

          <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>
            Coin Wallet
          </p>

          {/* Balance display */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: 12 }}>
            <motion.span
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 280, damping: 20, delay: 0.08 }}
              style={{ fontSize: 44, lineHeight: 1 }}
            >🪙</motion.span>
            <div>
              <div style={{ fontSize: 44, fontWeight: 900, color: GOLD, lineHeight: 1, letterSpacing: "-0.03em" }}>
                {loading
                  ? <span style={{ color: "rgba(245,158,11,0.4)" }}>···</span>
                  : <AnimatedNumber value={balance} />
                }
              </div>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 3 }}>coins available</p>
            </div>
          </div>

          {/* Section tabs */}
          <div style={{
            display: "flex", gap: 6, marginTop: 16,
            background: "rgba(255,255,255,0.05)", borderRadius: 14, padding: "3px 4px",
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
                  flex: 1, padding: "9px 0", borderRadius: 10, border: "none", cursor: "pointer",
                  background: section === s.id ? GOLD_DIM : "transparent",
                  color: section === s.id ? GOLD : "rgba(255,255,255,0.35)",
                  fontWeight: 800, fontSize: 13, transition: "all 0.16s",
                  outline: section === s.id ? `1px solid ${GOLD_BORDER}` : "none",
                }}
              >{s.label}</motion.button>
            ))}
          </div>
        </div>

        {/* ── Scrollable body ────────────────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px 40px", WebkitOverflowScrolling: "touch" } as React.CSSProperties}>

          {/* ════ WALLET SECTION ═══════════════════════════════════════════════ */}
          {section === "wallet" && (
            <motion.div key="wallet" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>

              <DailyEarnBar transactions={transactions} />

              {/* Recent activity */}
              <div style={{ marginTop: 20 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
                  Recent Activity
                </p>

                {txLoading ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {[1,2,3].map(i => (
                      <div key={i} style={{ height: 52, borderRadius: 12, background: "rgba(255,255,255,0.04)", animation: "pulse 1.5s ease-in-out infinite" }} />
                    ))}
                  </div>
                ) : transactions.length === 0 ? (
                  <div style={{
                    textAlign: "center", padding: "28px 20px",
                    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: 16,
                  }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>🕐</div>
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>No activity yet</p>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.18)", marginTop: 4 }}>Start liking profiles to earn free coins</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    {transactions.map((tx, i) => {
                      const { label, emoji } = txMeta(tx.reason);
                      const earn = tx.amount > 0;
                      return (
                        <motion.div
                          key={tx.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.035, duration: 0.2 }}
                          style={{
                            display: "flex", alignItems: "center", gap: 12,
                            padding: "11px 14px",
                            background: earn ? "rgba(34,197,94,0.04)" : "rgba(248,113,113,0.04)",
                            border: `1px solid ${earn ? "rgba(34,197,94,0.1)" : "rgba(248,113,113,0.1)"}`,
                            borderRadius: 13,
                          }}
                        >
                          <span style={{ fontSize: 20, flexShrink: 0 }}>{emoji}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.72)", fontWeight: 600, textTransform: "capitalize" }}>{label}</p>
                            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 1 }}>{relTime(tx.created_at)}</p>
                          </div>
                          <div style={{ fontSize: 15, fontWeight: 900, color: earn ? "#4ade80" : "#f87171", flexShrink: 0 }}>
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
                marginTop: 20, background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "14px 16px",
              }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
                  What coins unlock
                </p>
                {COIN_USES.map((u, i) => (
                  <div key={u.label} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "9px 0",
                    borderBottom: i < COIN_USES.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 17 }}>{u.emoji}</span>
                      <span style={{ fontSize: 13, color: "rgba(255,255,255,0.55)" }}>{u.label}</span>
                    </div>
                    <div style={{
                      fontSize: 11, fontWeight: 800, color: GOLD,
                      background: GOLD_DIM, borderRadius: 20, padding: "3px 9px",
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
                  marginTop: 18, width: "100%", padding: "16px", borderRadius: 50, border: "none",
                  background: "linear-gradient(135deg,#d97706,#f59e0b,#fbbf24)",
                  color: "#000", fontSize: 16, fontWeight: 900, cursor: "pointer",
                  boxShadow: "0 8px 32px rgba(245,158,11,0.35)", letterSpacing: "-0.01em",
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
                      marginBottom: 16, borderRadius: 16, padding: "14px 18px",
                      background: "linear-gradient(135deg,rgba(34,197,94,0.15),rgba(16,185,129,0.1))",
                      border: "1.5px solid rgba(34,197,94,0.4)",
                      display: "flex", alignItems: "center", gap: 12,
                    }}
                  >
                    <span style={{ fontSize: 28 }}>🎉</span>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 800, color: "#4ade80" }}>+{justBought.coins} coins added!</p>
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{justBought.label} pack · {formatIdr(justBought.priceIdr)}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Pack grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {COIN_PACKS.map((pack, i) => (
                  <motion.button
                    key={pack.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06, duration: 0.22 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setSelected(selected?.id === pack.id ? null : pack)}
                    style={{
                      background: selected?.id === pack.id
                        ? pack.gradient.replace(/rgba\((\d+),(\d+),(\d+),([\d.]+)\)/g, (_, r, g, b, a) => `rgba(${r},${g},${b},${Math.min(parseFloat(a) * 2.2, 0.6)})`)
                        : pack.gradient,
                      border: `1.5px solid ${selected?.id === pack.id ? pack.accentColor + "99" : pack.accentColor + "35"}`,
                      borderRadius: 18, padding: "16px 14px",
                      cursor: "pointer", textAlign: "left", position: "relative",
                      transition: "all 0.18s",
                      boxShadow: selected?.id === pack.id ? `0 0 28px ${pack.accentColor}28` : "none",
                    }}
                  >
                    {pack.tag && (
                      <div style={{
                        position: "absolute", top: -9, left: "50%", transform: "translateX(-50%)",
                        background: pack.accentColor, color: "white",
                        fontSize: 9, fontWeight: 800, letterSpacing: "0.06em",
                        padding: "2px 8px", borderRadius: 20, whiteSpace: "nowrap",
                      }}>{pack.tag}</div>
                    )}
                    {pack.saving && (
                      <div style={{
                        position: "absolute", top: 8, right: 8,
                        background: "rgba(34,197,94,0.2)", color: "#4ade80",
                        fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 10,
                      }}>{pack.saving}</div>
                    )}
                    <div style={{ fontSize: 22, marginBottom: 6 }}>{pack.emoji}</div>
                    <div style={{ fontSize: 21, fontWeight: 900, color: "white", lineHeight: 1 }}>{pack.coins.toLocaleString()}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2, marginBottom: 10 }}>coins</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: pack.accentColor }}>{formatIdr(pack.priceIdr)}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 1 }}>~${pack.priceUsd.toFixed(2)} USD</div>
                  </motion.button>
                ))}
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
                        background: `linear-gradient(135deg,${selected.accentColor},${selected.accentColor}cc)`,
                        color: "white", fontSize: 16, fontWeight: 900,
                        cursor: buying ? "not-allowed" : "pointer",
                        opacity: buying ? 0.7 : 1,
                        boxShadow: `0 8px 32px ${selected.accentColor}44`,
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {buying ? "Processing…" : `Buy ${selected.coins.toLocaleString()} coins · ${formatIdr(selected.priceIdr)}`}
                    </motion.button>
                    <p style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", textAlign: "center", margin: "8px 0 0" }}>
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
