import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Unlock, Clock, Sparkles, MapPin } from "lucide-react";
import { Profile } from "./SwipeCard";
import { Button } from "@/components/ui/button";
import PromoCard from "./PromoCard";
import { PREMIUM_FEATURES, PremiumFeature } from "@/data/premiumFeatures";
import { isOnline } from "@/hooks/useOnlineStatus";

// ── Countdown hook ────────────────────────────────────────────────────────────
const useCountdown = (expiresAt: string | null | undefined) => {
  const [timeLeft, setTimeLeft] = useState("");
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!expiresAt) { setTimeLeft(""); return; }
    const update = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) { setIsExpired(true); setTimeLeft("Expired"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setTimeLeft(`${h}h ${m}m`);
      setIsExpired(false);
    };
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, [expiresAt]);

  return { timeLeft, isExpired };
};

const CountdownBadge = ({ expiresAt }: { expiresAt: string | null | undefined }) => {
  const { timeLeft, isExpired } = useCountdown(expiresAt);
  if (!timeLeft) return null;
  return (
    <span className={`flex items-center gap-0.5 text-[8px] font-medium ${isExpired ? "text-destructive" : "text-accent"}`}>
      <Clock className="w-2.5 h-2.5" /> {timeLeft}
    </span>
  );
};

// ── How "new" a profile is (joined in last 7 days) ────────────────────────────
const isNewProfile = (p: Profile) => {
  if (!p.last_seen_at) return false;
  const diff = Date.now() - new Date(p.last_seen_at).getTime();
  return diff < 7 * 24 * 60 * 60 * 1000;
};

// ── Props ─────────────────────────────────────────────────────────────────────
interface LikesLibraryProps {
  iLiked: Profile[];
  likedMe: Profile[];
  newProfiles: Profile[];       // new: all profiles from Index, pre-filtered
  filterCountry?: string;       // new: active country filter so we can label it
  onUnlock: (profile: Profile) => void;
  onSelectProfile: (profile: Profile, sourceList: Profile[]) => void;
  onPurchaseFeature: (feature: PremiumFeature) => void;
}

type Tab = "sent" | "received" | "new";
type DisplayItem =
  | { type: "profile"; profile: Profile }
  | { type: "promo"; profile: null };

// ── Tab pill config ───────────────────────────────────────────────────────────
const TAB_LABELS: Record<Tab, (counts: Record<Tab, number>) => string> = {
  new:      (c) => `New${c.new > 0 ? ` · ${c.new}` : ""}`,
  sent:     (c) => `I Liked${c.sent > 0 ? ` · ${c.sent}` : ""}`,
  received: (c) => `Likes Me${c.received > 0 ? ` · ${c.received}` : ""}`,
};
const TABS: Tab[] = ["new", "sent", "received"];

// ── Component ─────────────────────────────────────────────────────────────────
const LikesLibrary = ({
  iLiked, likedMe, newProfiles, filterCountry,
  onUnlock, onSelectProfile, onPurchaseFeature,
}: LikesLibraryProps) => {
  const [tab, setTab] = useState<Tab>("new");
  const [activePromoIndex, setActivePromoIndex] = useState<number | null>(null);
  const [promoPosition, setPromoPosition] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const matches = iLiked.filter((p) => likedMe.some((l) => l.id === p.id));

  // Sort new profiles: most recently seen first, cap at 30
  const sortedNew = useMemo(() =>
    [...newProfiles]
      .sort((a, b) => {
        const ta = a.last_seen_at ? new Date(a.last_seen_at).getTime() : 0;
        const tb = b.last_seen_at ? new Date(b.last_seen_at).getTime() : 0;
        return tb - ta;
      })
      .slice(0, 50),
  [newProfiles]);

  const currentList: Profile[] =
    tab === "sent"     ? iLiked :
    tab === "received" ? likedMe :
    sortedNew;

  const counts: Record<Tab, number> = {
    sent:     iLiked.length,
    received: likedMe.length,
    new:      sortedNew.length,
  };

  // Scroll back to left whenever tab changes
  useEffect(() => {
    scrollRef.current?.scrollTo({ left: 0, behavior: "smooth" });
  }, [tab]);

  // ── Promo rotation ──────────────────────────────────────────────
  const pickNewPromo = useCallback(() => {
    const idx = Math.floor(Math.random() * PREMIUM_FEATURES.length);
    setActivePromoIndex(idx);
    const maxPos = Math.max(0, currentList.length);
    setPromoPosition(Math.floor(Math.random() * (maxPos + 1)));
  }, [currentList.length]);

  useEffect(() => {
    const t = setTimeout(pickNewPromo, 2000);
    return () => clearTimeout(t);
  }, [pickNewPromo]);

  useEffect(() => {
    if (activePromoIndex === null) return;
    const t = setTimeout(pickNewPromo, 5000 + Math.random() * 5000);
    return () => clearTimeout(t);
  }, [activePromoIndex, pickNewPromo]);

  // ── Build display list (with promo injected, but NOT on new tab) ─
  const displayItems = useMemo((): DisplayItem[] => {
    const items: DisplayItem[] = currentList.map((p) => ({ type: "profile" as const, profile: p }));
    if (tab !== "new" && activePromoIndex !== null) {
      const pos = Math.min(promoPosition, items.length);
      items.splice(pos, 0, { type: "promo" as const, profile: null });
    }
    return items;
  }, [currentList, activePromoIndex, promoPosition, tab]);

  // ── Swipe/scroll tabs on horizontal drag ────────────────────────
  const dragStart = useRef<{ x: number; tab: Tab } | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    dragStart.current = { x: e.touches[0].clientX, tab };
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!dragStart.current) return;
    const dx = e.changedTouches[0].clientX - dragStart.current.x;
    const idx = TABS.indexOf(dragStart.current.tab);
    if (dx < -50 && idx < TABS.length - 1) setTab(TABS[idx + 1]);
    if (dx > 50  && idx > 0)              setTab(TABS[idx - 1]);
    dragStart.current = null;
  };

  // ── Empty-state copy ────────────────────────────────────────────
  const emptyText =
    tab === "new"      ? "Loading profiles..." :
    tab === "sent"     ? "Swipe up or down to like!" :
    "No likes yet — keep swiping!";

  return (
    <div
      className="h-full flex flex-col"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-2 flex-shrink-0">
        <h2 className="font-display font-bold text-sm text-foreground flex items-center gap-1.5">
          <Heart className="w-4 h-4 text-primary" fill="currentColor" />
          Library
        </h2>

        {/* 3-tab pill */}
        <div className="relative flex gap-0 p-0.5 bg-black/40 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
          {/* Sliding background */}
          <motion.div
            className="absolute top-0.5 bottom-0.5 rounded-[10px] gradient-love"
            animate={{ left: `calc(${TABS.indexOf(tab)} * 33.33% + 2px)`, width: "calc(33.33% - 4px)" }}
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
          />
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`relative z-10 py-1 px-1.5 rounded-[10px] text-[9px] font-semibold transition-colors min-w-[56px] text-center ${
                tab === t ? "text-white" : "text-white/40 hover:text-white/70"
              }`}
            >
              {TAB_LABELS[t](counts)}
            </button>
          ))}
        </div>
      </div>

      {/* ── New profiles label ── */}
      <AnimatePresence>
        {tab === "new" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-1.5 mb-1.5 flex-shrink-0 overflow-hidden"
          >
            <Sparkles className="w-3 h-3 text-amber-400 flex-shrink-0" />
            <span className="text-[9px] text-white/50">
              {filterCountry
                ? `Recently active in ${filterCountry}`
                : "Recently active profiles — scroll to explore"}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Scrollable card row ── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-x-auto overflow-y-hidden [&::-webkit-scrollbar]:hidden scroll-touch"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch", overscrollBehaviorX: "contain" }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.18 }}
            className="flex gap-2 h-full py-1"
          >
            {displayItems.length === 0 ? (
              <div className="flex items-center justify-center flex-1 px-4">
                <p className="text-white/40 text-xs text-center">{emptyText}</p>
              </div>
            ) : (
              displayItems.map((item, idx) => {
                // ── Promo card ──
                if (item.type === "promo" && activePromoIndex !== null) {
                  return (
                    <PromoCard
                      key={`promo-${activePromoIndex}`}
                      feature={PREMIUM_FEATURES[activePromoIndex]}
                      onPurchase={onPurchaseFeature}
                    />
                  );
                }

                const profile = item.profile;
                if (!profile) return null;
                const isMatch = matches.some((m) => m.id === profile.id);
                const fresh   = tab === "new" && isNewProfile(profile);

                return (
                  <motion.div
                    key={`${tab}-${profile.id}`}
                    initial={{ opacity: 0, scale: 0.88 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.88 }}
                    transition={{ delay: Math.min(idx * 0.04, 0.3) }}
                    onClick={() => onSelectProfile(profile, currentList)}
                    className="flex-shrink-0 flex flex-col items-center gap-1 p-2 rounded-xl cursor-pointer transition-all hover:scale-105 bg-black/50 backdrop-blur-md border border-white/10 relative"
                    style={{ width: 80 }}
                  >
                    {/* NEW badge */}
                    {fresh && (
                      <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 z-10">
                        <span className="bg-amber-400 text-black text-[7px] font-black px-1.5 py-0.5 rounded-full tracking-wide shadow-[0_0_8px_rgba(251,191,36,0.5)]">
                          NEW
                        </span>
                      </div>
                    )}

                    {/* Available tonight glow — shown as moon badge only, no ring */}

                    <div className="relative mt-1">
                      <img
                        src={profile.avatar_url || profile.image}
                        alt={profile.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-white/10"
                      />
                      {profile.is_rose && tab !== "new" && (
                        <span className="absolute -top-1 -right-1 text-sm">❤️</span>
                      )}
                      {/* Plus-One badge — top-left corner, always visible */}
                      {/* Single status badge — +1 beats Free Tonight */}
                      {(profile as any).is_plusone ? (
                        <span className="absolute -top-1 -left-1 bg-black border border-yellow-400/70 rounded-full w-4 h-4 flex items-center justify-center shadow-[0_0_6px_rgba(250,204,21,0.5)]">
                          <span className="text-yellow-300 font-black text-[7px] leading-none">+1</span>
                        </span>
                      ) : tab === "new" && profile.available_tonight ? (
                        <span className="absolute -bottom-1 -right-1 text-[10px] bg-black border border-yellow-400/70 rounded-full w-4 h-4 flex items-center justify-center shadow-[0_0_6px_rgba(250,204,21,0.5)]">🌙</span>
                      ) : null}
                      {/* Green heartbeat dot — avoid overlap with moon badge */}
                      {isOnline(profile.last_seen_at) && !((profile as any).is_plusone) && !(tab === "new" && profile.available_tonight) && (
                        <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-70" />
                          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-green-400 border-2 border-black shadow-[0_0_6px_rgba(74,222,128,0.7)]" />
                        </span>
                      )}
                      {/* online dot when free tonight badge is showing — move to left */}
                      {isOnline(profile.last_seen_at) && !((profile as any).is_plusone) && tab === "new" && profile.available_tonight && (
                        <span className="absolute -bottom-0.5 -left-0.5 flex h-3.5 w-3.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-70" />
                          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-green-400 border-2 border-black shadow-[0_0_6px_rgba(74,222,128,0.7)]" />
                        </span>
                      )}
                      {/* online dot when +1 badge is showing — move to bottom-right */}
                      {isOnline(profile.last_seen_at) && (profile as any).is_plusone && (
                        <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-70" />
                          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-green-400 border-2 border-black shadow-[0_0_6px_rgba(74,222,128,0.7)]" />
                        </span>
                      )}
                    </div>

                    <p className="text-white text-[10px] font-semibold truncate w-full text-center">
                      {profile.name}, {profile.age}
                    </p>

                    {tab === "new" ? (
                      <p className="text-white/50 text-[8px] truncate w-full text-center flex items-center justify-center gap-0.5">
                        <MapPin className="w-2 h-2 flex-shrink-0" />
                        {profile.city || profile.country}
                      </p>
                    ) : (
                      <p className="text-white/50 text-[9px] truncate w-full text-center">
                        {profile.country}
                      </p>
                    )}

                    {tab !== "new" && <CountdownBadge expiresAt={profile.expires_at} />}

                    {isMatch && tab !== "new" && (
                      <Button
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); onUnlock(profile); }}
                        className="gradient-love text-primary-foreground border-0 text-[8px] h-5 px-1.5 mt-0.5 w-full"
                        aria-label={`Unlock WhatsApp with ${profile.name}`}
                      >
                        <Unlock className="w-2.5 h-2.5 mr-0.5" /> $1.99
                      </Button>
                    )}
                  </motion.div>
                );
              })
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Tab dot indicators removed — swipe tabs with finger ── */}
    </div>
  );
};

export default LikesLibrary;
