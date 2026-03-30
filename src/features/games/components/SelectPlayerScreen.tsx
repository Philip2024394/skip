import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

const GOLD = "#d4af37";
const GOLD_GLOW = "rgba(212,175,55,0.5)";
const RANKS = ["🥇", "🥈", "🥉", "4", "5"];

interface Player {
  id: string;
  name: string;
  avatar_url?: string | null;
  country?: string | null;
  coins_balance: number;
  last_seen_at?: string | null;
  rank?: number; // 1-5 if top5
}

interface Props {
  onBack: () => void;
  onChallenge: (player: Player) => void;
}

// ── Country → flag emoji ──────────────────────────────────────────────────────
const FLAG_MAP: Record<string, string> = {
  "south africa": "🇿🇦", "united states": "🇺🇸", "usa": "🇺🇸", "us": "🇺🇸",
  "united kingdom": "🇬🇧", "uk": "🇬🇧", "england": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "scotland": "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  "australia": "🇦🇺", "canada": "🇨🇦", "nigeria": "🇳🇬", "ghana": "🇬🇭",
  "kenya": "🇰🇪", "zimbabwe": "🇿🇼", "tanzania": "🇹🇿", "uganda": "🇺🇬",
  "ethiopia": "🇪🇹", "cameroon": "🇨🇲", "egypt": "🇪🇬", "morocco": "🇲🇦",
  "india": "🇮🇳", "pakistan": "🇵🇰", "bangladesh": "🇧🇩", "sri lanka": "🇱🇰",
  "brazil": "🇧🇷", "mexico": "🇲🇽", "colombia": "🇨🇴", "argentina": "🇦🇷",
  "chile": "🇨🇱", "peru": "🇵🇪", "venezuela": "🇻🇪",
  "germany": "🇩🇪", "france": "🇫🇷", "spain": "🇪🇸", "italy": "🇮🇹",
  "netherlands": "🇳🇱", "belgium": "🇧🇪", "sweden": "🇸🇪", "norway": "🇳🇴",
  "denmark": "🇩🇰", "finland": "🇫🇮", "poland": "🇵🇱", "portugal": "🇵🇹",
  "greece": "🇬🇷", "turkey": "🇹🇷", "russia": "🇷🇺", "ukraine": "🇺🇦",
  "austria": "🇦🇹", "switzerland": "🇨🇭", "ireland": "🇮🇪", "new zealand": "🇳🇿",
  "china": "🇨🇳", "japan": "🇯🇵", "south korea": "🇰🇷", "indonesia": "🇮🇩",
  "malaysia": "🇲🇾", "singapore": "🇸🇬", "thailand": "🇹🇭", "philippines": "🇵🇭",
  "vietnam": "🇻🇳", "uae": "🇦🇪", "united arab emirates": "🇦🇪",
  "saudi arabia": "🇸🇦", "israel": "🇮🇱", "iraq": "🇮🇶", "iran": "🇮🇷",
};

function getFlag(country?: string | null): string {
  if (!country) return "🌍";
  return FLAG_MAP[country.toLowerCase().trim()] ?? "🌍";
}

function isOnline(lastSeenAt?: string | null): boolean {
  if (!lastSeenAt) return false;
  return Date.now() - new Date(lastSeenAt).getTime() < 3 * 60 * 1000;
}

// ── Player Card ───────────────────────────────────────────────────────────────
function PlayerCard({
  player, onChallenge, invited, onInvite, onUninvite, inviteFull,
}: {
  player: Player;
  onChallenge: (p: Player) => void;
  invited: boolean;
  onInvite: (p: Player) => void;
  onUninvite: (id: string) => void;
  inviteFull: boolean;
}) {
  const online = isOnline(player.last_seen_at);
  const isTop5 = !!player.rank;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: isTop5
          ? "linear-gradient(135deg, rgba(212,175,55,0.1), rgba(255,215,0,0.06))"
          : "rgba(255,255,255,0.04)",
        border: isTop5
          ? "1px solid rgba(212,175,55,0.4)"
          : "1px solid rgba(255,255,255,0.07)",
        borderRadius: 16, padding: "12px 14px",
        display: "flex", alignItems: "center", gap: 12,
        boxShadow: isTop5 ? `0 0 20px rgba(212,175,55,0.12)` : "none",
      }}
    >
      {/* Rank / Avatar */}
      <div style={{ position: "relative", flexShrink: 0 }}>
        <div style={{
          width: 44, height: 44, borderRadius: "50%", overflow: "hidden",
          border: `2px solid ${isTop5 ? GOLD : "rgba(255,255,255,0.1)"}`,
          background: "rgba(255,255,255,0.06)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18,
          boxShadow: isTop5 ? `0 0 14px ${GOLD_GLOW}` : "none",
        }}>
          {player.avatar_url
            ? <img src={player.avatar_url} alt={player.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <span style={{ color: "rgba(255,255,255,0.5)", fontWeight: 900, fontSize: 16 }}>
                {player.name?.[0]?.toUpperCase() ?? "?"}
              </span>
          }
        </div>
        {/* Online dot */}
        <div style={{
          position: "absolute", bottom: 1, right: 1,
          width: 10, height: 10, borderRadius: "50%",
          background: online ? "#22c55e" : "rgba(255,255,255,0.2)",
          border: "2px solid #08060a",
        }} />
        {/* Rank badge */}
        {isTop5 && (
          <div style={{
            position: "absolute", top: -4, left: -4,
            fontSize: 14, lineHeight: 1,
          }}>{RANKS[(player.rank ?? 1) - 1]}</div>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{
            fontSize: 14, fontWeight: 800,
            color: isTop5 ? GOLD : "white",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>{player.name}</span>
          {isTop5 && (
            <span style={{
              fontSize: 9, fontWeight: 900, color: "#000",
              background: "linear-gradient(135deg, #d4af37, #f0d060)",
              borderRadius: 6, padding: "2px 6px", letterSpacing: "0.05em", flexShrink: 0,
            }}>TOP 5</span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
          <span style={{ fontSize: 12 }}>{getFlag(player.country)}</span>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
            {player.country ?? "Unknown"}
          </span>
          <span style={{ fontSize: 11, color: online ? "#22c55e" : "rgba(255,255,255,0.25)" }}>
            {online ? "● Online" : "○ Away"}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
          <span style={{ fontSize: 11 }}>🪙</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: isTop5 ? GOLD : "rgba(255,255,255,0.4)" }}>
            {player.coins_balance.toLocaleString()}
          </span>
          {isTop5 && (
            <span style={{ fontSize: 10, color: "rgba(255,215,0,0.55)", marginLeft: 4 }}>
              Bet: 20–50 🪙
            </span>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => onChallenge(player)}
          style={{
            padding: "7px 14px", borderRadius: 10,
            background: isTop5
              ? "linear-gradient(135deg, #92400e, #d4af37, #f0d060)"
              : "rgba(255,215,0,0.12)",
            border: isTop5 ? "1px solid transparent" : "1px solid rgba(255,215,0,0.3)",
            color: isTop5 ? "#000" : GOLD,
            fontWeight: 900, fontSize: 12, cursor: "pointer",
          }}
        >Challenge</motion.button>

        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => invited ? onUninvite(player.id) : onInvite(player)}
          disabled={!invited && inviteFull}
          style={{
            padding: "5px 10px", borderRadius: 10,
            background: invited ? "rgba(238,28,36,0.15)" : "rgba(255,255,255,0.05)",
            border: invited ? "1px solid rgba(238,28,36,0.3)" : "1px solid rgba(255,255,255,0.1)",
            color: invited ? "#ff6b6b" : "rgba(255,255,255,0.35)",
            fontWeight: 700, fontSize: 11, cursor: inviteFull && !invited ? "default" : "pointer",
            opacity: inviteFull && !invited ? 0.4 : 1,
          }}
        >{invited ? "✗ Remove" : "+ Invite"}</motion.button>
      </div>
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function SelectPlayerScreen({ onBack, onChallenge }: Props) {
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [top5, setTop5] = useState<Player[]>([]);
  const [myCountry, setMyCountry] = useState<string | null>(null);
  const [searchCountry, setSearchCountry] = useState("");
  const [invited, setInvited] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"country" | "world">("country");

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      // Get current user's country
      if (user) {
        const { data: me } = await supabase
          .from("profiles")
          .select("country")
          .eq("id", user.id)
          .single();
        setMyCountry((me as any)?.country ?? null);
      }

      // Fetch all active profiles with relevant fields, sorted by coins desc
      const { data } = await supabase
        .from("profiles")
        .select("id, name, avatar_url, country, coins_balance, last_seen_at")
        .eq("is_active", true)
        .eq("is_banned", false)
        .order("coins_balance", { ascending: false })
        .limit(200);

      const profiles = ((data as any[]) ?? []).filter(p =>
        user ? p.id !== user.id : true
      );

      // Top 5 globally by coins
      const top = profiles.slice(0, 5).map((p, i) => ({ ...p, rank: i + 1 }));
      setTop5(top);
      setAllPlayers(profiles);
      setLoading(false);
    }
    load();
  }, []);

  function addInvite(player: Player) {
    if (invited.size >= 5) return;
    setInvited(prev => new Set([...prev, player.id]));
  }
  function removeInvite(id: string) {
    setInvited(prev => { const s = new Set(prev); s.delete(id); return s; });
  }

  const countryFilter = searchCountry.trim().toLowerCase();

  // Local players (same country as me)
  const localPlayers = allPlayers.filter(p =>
    p.country && myCountry &&
    p.country.toLowerCase() === myCountry.toLowerCase()
  );

  // Filtered players for search
  const filteredPlayers = countryFilter
    ? allPlayers.filter(p => p.country?.toLowerCase().includes(countryFilter))
    : allPlayers;

  // World players (not same country)
  const worldPlayers = allPlayers.filter(p =>
    !myCountry || !p.country || p.country.toLowerCase() !== myCountry.toLowerCase()
  );

  const showWorldTab = !myCountry || localPlayers.length < 3;

  // Active list based on tab/search
  const activeList = countryFilter
    ? filteredPlayers
    : tab === "country" && !showWorldTab
      ? localPlayers
      : worldPlayers;

  return (
    <div style={{
      height: "100%", display: "flex", flexDirection: "column",
      background: "#08060a", overflow: "hidden",
    }}>
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div style={{
        padding: "max(18px,env(safe-area-inset-top,18px)) 16px 12px",
        display: "flex", alignItems: "center", gap: 12, flexShrink: 0,
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <button onClick={onBack} style={{
          background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 20, padding: "7px 14px",
          color: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: 700, cursor: "pointer",
          flexShrink: 0,
        }}>← Back</button>
        <div style={{ flex: 1 }}>
          <div style={{ color: "white", fontWeight: 900, fontSize: 16 }}>Select Player</div>
          <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>
            Challenge a player to Connect 4
          </div>
        </div>
        {invited.size > 0 && (
          <div style={{
            background: "linear-gradient(135deg, #92400e, #d4af37)",
            borderRadius: 20, padding: "6px 14px",
            color: "#000", fontSize: 12, fontWeight: 900,
          }}>
            {invited.size}/5 invited
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px 24px", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* ── Top 5 Section ──────────────────────────────────────────── */}
        <div>
          <div style={{
            display: "flex", alignItems: "center", gap: 8, marginBottom: 10,
          }}>
            <span style={{ fontSize: 16 }}>🏆</span>
            <span style={{ fontSize: 12, fontWeight: 900, color: GOLD, letterSpacing: "0.08em" }}>
              TOP 5 PLAYERS WORLDWIDE
            </span>
            <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, rgba(212,175,55,0.3), transparent)" }} />
          </div>
          <div style={{
            background: "rgba(212,175,55,0.05)", border: "1px solid rgba(212,175,55,0.15)",
            borderRadius: 12, padding: "8px 12px", marginBottom: 10,
            fontSize: 11, color: "rgba(255,215,0,0.6)", lineHeight: 1.5,
          }}>
            🪙 Challenging a Top 5 player requires a minimum bet of <strong style={{ color: GOLD }}>20 coins</strong>. Stakes: 20 / 30 / 40 / 50
          </div>
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[...Array(3)].map((_, i) => (
                <div key={i} style={{ height: 72, borderRadius: 16, background: "rgba(255,255,255,0.04)", animation: "pulse 1.5s infinite" }} />
              ))}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {top5.map(p => (
                <PlayerCard key={p.id} player={p}
                  onChallenge={onChallenge}
                  invited={invited.has(p.id)}
                  onInvite={addInvite}
                  onUninvite={removeInvite}
                  inviteFull={invited.size >= 5}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Search ─────────────────────────────────────────────────── */}
        <div>
          <div style={{
            display: "flex", alignItems: "center", gap: 8, marginBottom: 10,
          }}>
            <span style={{ fontSize: 14 }}>🔍</span>
            <span style={{ fontSize: 12, fontWeight: 900, color: "rgba(255,255,255,0.45)", letterSpacing: "0.06em" }}>
              SEARCH BY COUNTRY
            </span>
          </div>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 16 }}>
              {getFlag(searchCountry) !== "🌍" ? getFlag(searchCountry) : "🌍"}
            </span>
            <input
              value={searchCountry}
              onChange={e => setSearchCountry(e.target.value)}
              placeholder="e.g. South Africa, Nigeria, UK…"
              style={{
                width: "100%", boxSizing: "border-box",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 12, padding: "10px 14px 10px 38px",
                color: "white", fontSize: 13, outline: "none",
              }}
            />
          </div>
        </div>

        {/* ── Country / World tabs ────────────────────────────────────── */}
        {!countryFilter && (
          <div>
            {/* Tab switcher */}
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              {!showWorldTab && (
                <button
                  onClick={() => setTab("country")}
                  style={{
                    flex: 1, height: 36, borderRadius: 10,
                    background: tab === "country" ? "rgba(212,175,55,0.15)" : "rgba(255,255,255,0.04)",
                    border: tab === "country" ? "1px solid rgba(212,175,55,0.4)" : "1px solid rgba(255,255,255,0.08)",
                    color: tab === "country" ? GOLD : "rgba(255,255,255,0.4)",
                    fontWeight: 800, fontSize: 12, cursor: "pointer",
                  }}
                >
                  {getFlag(myCountry)} {myCountry ?? "My Country"} ({localPlayers.length})
                </button>
              )}
              <button
                onClick={() => setTab("world")}
                style={{
                  flex: 1, height: 36, borderRadius: 10,
                  background: (tab === "world" || showWorldTab) ? "rgba(212,175,55,0.15)" : "rgba(255,255,255,0.04)",
                  border: (tab === "world" || showWorldTab) ? "1px solid rgba(212,175,55,0.4)" : "1px solid rgba(255,255,255,0.08)",
                  color: (tab === "world" || showWorldTab) ? GOLD : "rgba(255,255,255,0.4)",
                  fontWeight: 800, fontSize: 12, cursor: "pointer",
                }}
              >
                🌍 Worldwide ({worldPlayers.length})
              </button>
            </div>

            {/* Section label */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 13 }}>
                {tab === "country" && !showWorldTab ? getFlag(myCountry) : "🌍"}
              </span>
              <span style={{ fontSize: 12, fontWeight: 900, color: "rgba(255,255,255,0.35)", letterSpacing: "0.06em" }}>
                {tab === "country" && !showWorldTab
                  ? `PLAYERS IN ${(myCountry ?? "YOUR COUNTRY").toUpperCase()}`
                  : "PLAYERS WORLDWIDE"}
              </span>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
            </div>

            {showWorldTab && localPlayers.length === 0 && myCountry && (
              <div style={{
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 12, padding: "12px 14px", marginBottom: 10,
                fontSize: 12, color: "rgba(255,255,255,0.35)", textAlign: "center",
              }}>
                No players online from {myCountry} right now — showing worldwide players
              </div>
            )}
          </div>
        )}

        {/* ── Player list ─────────────────────────────────────────────── */}
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} style={{ height: 72, borderRadius: 16, background: "rgba(255,255,255,0.04)" }} />
            ))}
          </div>
        ) : activeList.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "32px 16px",
            color: "rgba(255,255,255,0.3)", fontSize: 13,
          }}>
            {countryFilter ? `No players found for "${searchCountry}"` : "No players online right now"}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <AnimatePresence>
              {activeList.map(p => (
                <PlayerCard key={p.id} player={p}
                  onChallenge={onChallenge}
                  invited={invited.has(p.id)}
                  onInvite={addInvite}
                  onUninvite={removeInvite}
                  inviteFull={invited.size >= 5}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* ── Send all invites CTA ─────────────────────────────────────── */}
        <AnimatePresence>
          {invited.size > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              style={{
                position: "sticky", bottom: 0,
                background: "linear-gradient(180deg, transparent, #08060a 30%)",
                paddingTop: 16,
              }}
            >
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  // In real multiplayer this would send push notifications
                  // For now just acknowledge
                  alert(`Challenges sent to ${invited.size} player${invited.size > 1 ? "s" : ""}! First to accept plays.`);
                }}
                style={{
                  width: "100%", height: 54, borderRadius: 16, border: "none",
                  background: "linear-gradient(135deg, #92400e, #d4af37, #f0d060)",
                  color: "#000", fontWeight: 900, fontSize: 16, cursor: "pointer",
                  boxShadow: "0 6px 28px rgba(212,175,55,0.4)",
                }}
              >
                🎮 Send {invited.size} Challenge{invited.size > 1 ? "s" : ""}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
