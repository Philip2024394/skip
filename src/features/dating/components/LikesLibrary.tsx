import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Unlock, Clock, Sparkles, MapPin, Star, CalendarDays, MoonStar, ShieldCheck } from "lucide-react";
import { Profile } from "./SwipeCard";
import LikesCarousel from "@/features/dating/components/likes-library/LikesCarousel";
import { Button } from "@/shared/components/button";
import PromoCard from "@/shared/components/PromoCard";
import { PREMIUM_FEATURES, PremiumFeature } from "@/data/premiumFeatures";
import { isOnline } from "@/shared/hooks/useOnlineStatus";
import { getUnlockPriceLabel } from "@/shared/utils/unlockPrice";
// import GiftsTab from "@/components/gifts/GiftsTab";
import { supabase } from "@/integrations/supabase/client";
import GiftSelector from "@/features/gifts/components/GiftSelector";
import VideoContainer from "@/features/video/components/VideoContainer";
import { CountdownBadge } from "@/features/dating/components/likes-library/CountdownBadge";

// ── How "new" a profile is (joined in last 7 days) ────────────────────────────
const isNewProfile = (p: Profile) => {
  // Use created_at if available, fall back to last_seen_at for mock profiles
  const dateStr = (p as Profile & { created_at?: string }).created_at || p.last_seen_at;
  if (!dateStr) return false;
  const diff = Date.now() - new Date(dateStr).getTime();
  return diff < 7 * 24 * 60 * 60 * 1000; // joined within the last 7 days
};

// ── Props ─────────────────────────────────────────────────────────────────────
interface LikesLibraryProps {
  title?: string;
  tabLabelOverrides?: Partial<Record<Tab, string>>;
  profileFirstDateIdea?: string | null;
  profileDatePlaces?: Profile["first_date_places"];
  onTabChange?: (tab: Tab) => void;
  selectedProfileSection?: "basic" | "lifestyle" | "interests" | "images" | "activity";
  onSelectProfileSection?: (section: "basic" | "lifestyle" | "interests" | "images" | "activity") => void;
  selectedUnlockItemKey?: string;
  onSelectUnlockItem?: (key: string) => void;
  selectedTreatItem?: TreatKey | null;
  onSelectTreatItem?: (key: TreatKey) => void;
  selectedDateIdeaIndex?: number;
  onSelectDateIdea?: (index: number) => void;
  // Gifts tab props
  selectedProfile?: Profile | null;
  allProfiles?: Profile[];
  onGiftSent?: () => void;
  iLiked: Profile[];
  likedMe: Profile[];
  newProfiles: Profile[];       // new: all profiles from Index, pre-filtered
  filterCountry?: string;       // new: active country filter so we can label it
  receivedHighlightProfileId?: string | null;  // when set, switch to "Likes Me" and butterfly is flying to this profile
  heartDropProfileId?: string | null;          // when set, show dropped heart on this profile's card (Likes Me tab)
  superLikeGlowProfileId?: string | null;     // when set, show yellow glow on this profile's card (Likes Me tab, first in list)
  hidePrivateTabs?: boolean;
  currentUserId?: string;
  onUnlock: (profile: Profile) => void;
  onChat?: (profile: Profile) => void;
  onSelectProfile: (profile: Profile, sourceList: Profile[]) => void;
  onPurchaseFeature: (feature: PremiumFeature) => void;
  onCulturalGuide?: () => void;
}

type Tab = "sent" | "received" | "new" | "treat" | "unlock" | "distance" | "gifts" | "video";
type DisplayItem =
  | { type: "profile"; profile: Profile }
  | { type: "promo"; profile: null };

// ── Tab pill config ───────────────────────────────────────────────────────────
const TAB_LABELS: Record<Tab, (counts: Record<Tab, number>) => string> = {
  new: () => "New",
  sent: () => "I Liked",
  received: (c) => c.received > 0 ? `Likes Me (${c.received})` : "Likes Me",
  treat: () => "Treat",
  unlock: () => "Unlock",
  distance: () => "Distance",
  gifts: () => "Super",
  video: () => "Video",
};
// Home page shows New / Treat / Unlock; profile page shows About Me / Date Ideas / Unlock / Distance
const HOME_TABS: Tab[] = ["new", "sent", "received", "unlock"];
const PROFILE_TABS: Tab[] = ["new", "sent", "treat", "gifts"];

const TREAT_ITEMS = [
  { key: "massage", emoji: "💆", label: "Massage", desc: "Relaxing full-body massage", image: "https://ik.imagekit.io/7grri5v7d/massage%20therapsy.png?updatedAt=1773339304480" },
  { key: "beautician", emoji: "💅", label: "Beautician", desc: "Professional beauty treatment", image: "https://ik.imagekit.io/7grri5v7d/beauty%20woman.png?updatedAt=1773339036755" },
  { key: "flowers", emoji: "🌸", label: "Flowers", desc: "Fresh flower bouquet", image: "https://ik.imagekit.io/7grri5v7d/flowers%20nice.png?updatedAt=1773339411434" },
  { key: "jewelry", emoji: "💎", label: "Jewelry", desc: "Sparkling gift", image: "https://ik.imagekit.io/7grri5v7d/jewerlysss.png?updatedAt=1773338936919" },
] as const;
type TreatKey = typeof TREAT_ITEMS[number]["key"];

// ── Component ─────────────────────────────────────────────────────────────────
const LikesLibrary = ({
  title,
  tabLabelOverrides,
  profileFirstDateIdea,
  profileDatePlaces,
  onTabChange,
  selectedProfileSection,
  onSelectProfileSection,
  selectedUnlockItemKey,
  onSelectUnlockItem,
  selectedTreatItem,
  onSelectTreatItem,
  selectedDateIdeaIndex,
  onSelectDateIdea,
  // Gifts tab props
  selectedProfile,
  allProfiles,
  onGiftSent,
  iLiked, likedMe, newProfiles, filterCountry,
  hidePrivateTabs,
  currentUserId,
  receivedHighlightProfileId, heartDropProfileId, superLikeGlowProfileId,
  onUnlock, onChat, onSelectProfile, onPurchaseFeature, onCulturalGuide,
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
    tab === "sent" ? iLiked :
      tab === "received" ? likedMe :
        sortedNew;

  const counts: Record<Tab, number> = {
    sent: iLiked.length,
    received: likedMe.length,
    new: sortedNew.length,
    treat: 0,
    unlock: 0,
    distance: 0,
    gifts: 0,
    video: 0,
  };

  // Scroll back to left whenever tab changes
  useEffect(() => {
    scrollRef.current?.scrollTo({ left: 0, behavior: "smooth" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // When butterfly is flying to a profile, show "Likes Me" so the user sees who liked them
  useEffect(() => {
    if (receivedHighlightProfileId) setTab("received");
  }, [receivedHighlightProfileId]);



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

  // ── Swipe/scroll tabs on horizontal drag — header area only ────────────────
  const dragStart = useRef<{ x: number; y: number; tab: Tab } | null>(null);
  const handleTabAreaTouchStart = (e: React.TouchEvent) => {
    dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, tab };
  };
  const handleTabAreaTouchEnd = (e: React.TouchEvent) => {
    if (!dragStart.current) return;
    const dx = e.changedTouches[0].clientX - dragStart.current.x;
    const dy = Math.abs(e.changedTouches[0].clientY - dragStart.current.y);
    // Only switch tabs if horizontal swipe is dominant (not a vertical scroll attempt)
    if (dy > Math.abs(dx)) { dragStart.current = null; return; }
    const activeTabs = tabLabelOverrides ? PROFILE_TABS : HOME_TABS;
    const idx = activeTabs.indexOf(dragStart.current.tab);
    if (dx < -50 && idx < activeTabs.length - 1) {
      const next = activeTabs[idx + 1];
      setTab(next);
      onTabChange?.(next);
    }
    if (dx > 50 && idx > 0) {
      const next = activeTabs[idx - 1];
      setTab(next);
      onTabChange?.(next);
    }
    dragStart.current = null;
  };

  // ── Empty-state copy ────────────────────────────────────────────
  const emptyText =
    tab === "sent" ? "Swipe up or down to like!" :
      "No likes yet — keep swiping!";

  const isDateIdeasTab =
    tab === "sent" &&
    tabLabelOverrides?.sent === "Date Ideas";

  const isProfileInfoTab =
    tab === "new" &&
    tabLabelOverrides?.new === "Profile";

  const isTreatTab = tab === "treat";
  const isUnlockTab =
    tab === "unlock" ||
    (tab === "received" && tabLabelOverrides?.received === "Unlock");

  const dateIdeas = (
    (profileDatePlaces || [])
      .filter((p): p is NonNullable<typeof p> => !!p)
      .slice(0, 3)
  ) as NonNullable<Profile["first_date_places"]>;

  // Check if we have any date ideas to display
  const hasDateIdeas = dateIdeas.length > 0 || profileFirstDateIdea;

  return (
    <div className="h-full flex flex-col">
      {/* ── Header — tab swipe gesture lives here only ── */}
      <div
        className="flex items-center justify-between mb-2 flex-shrink-0"
        onTouchStart={handleTabAreaTouchStart}
        onTouchEnd={handleTabAreaTouchEnd}
      >
        <h2 className="font-display font-bold text-sm text-foreground flex items-center gap-1.5">
          <Heart className="w-4 h-4 text-primary" fill="currentColor" />
          {title ?? "Match"}
        </h2>


        {/* 3-tab pill */}
        <div className="relative flex gap-0 p-0.5 bg-black/40 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
          {(() => {
            const baseTabs = tabLabelOverrides ? PROFILE_TABS : HOME_TABS;
            const visibleTabs = hidePrivateTabs ? baseTabs.filter((t) => t !== "received" && t !== "sent") : baseTabs;
            const visibleIndex = Math.max(0, visibleTabs.indexOf(tab));
            const pct = 100 / visibleTabs.length;
            return (
              <>
                {/* Sliding background */}
                <motion.div
                  className="absolute top-0.5 bottom-0.5 rounded-[10px] gradient-love"
                  animate={{
                    left: `calc(${visibleIndex} * ${pct}% + 2px)`,
                    width: `calc(${pct}% - 4px)`,
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                />
                {visibleTabs.map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      onTabChange?.(t);
                      requestAnimationFrame(() => setTab(t));
                    }}
                    className={`relative z-10 py-1 px-1.5 rounded-[10px] text-[9px] font-semibold transition-colors min-w-[44px] text-center ${tab === t ? "text-white" : "text-white/40 hover:text-white/70"}`}
                  >
                    {tabLabelOverrides?.[t] ?? TAB_LABELS[t](counts)}
                  </button>
                ))}
              </>
            );
          })()}
        </div>
      </div>

      {/* ── Blurred Likes Me upsell banner ── */}
      <AnimatePresence>
        {tab === "received" && likedMe.length > 0 && likedMe.some(p => !iLiked.some(l => l.id === p.id)) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 mb-2 flex-shrink-0 overflow-hidden"
          >
            <div style={{
              width: "100%", display: "flex", alignItems: "center", gap: 8,
              background: "linear-gradient(135deg, rgba(236,72,153,0.12), rgba(168,85,247,0.12))",
              border: "1px solid rgba(236,72,153,0.22)",
              borderRadius: 10, padding: "6px 10px",
            }}>
              <span style={{ fontSize: 14 }}>👑</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: "white", fontSize: 10, fontWeight: 800, margin: 0 }}>
                  {likedMe.filter(p => !iLiked.some(l => l.id === p.id)).length} people liked you
                </p>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 9, margin: 0 }}>
                  Match back or upgrade VIP to see who
                </p>
              </div>
              <button
                onClick={() => onPurchaseFeature(PREMIUM_FEATURES.find(f => f.id === "vip") ?? PREMIUM_FEATURES[0])}
                style={{
                  background: "linear-gradient(135deg,#ec4899,#a855f7)",
                  border: "none", borderRadius: 8, padding: "4px 10px",
                  color: "white", fontSize: 9, fontWeight: 800, cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                Unlock
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── New profiles label ── */}
      <AnimatePresence>
        {tab === "new" && !isProfileInfoTab && (
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

      {/* ── Super label ── */}
      <AnimatePresence>
        {tab === "gifts" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-1.5 mb-1.5 flex-shrink-0 overflow-hidden"
          >
            <Star className="w-3 h-3 text-yellow-400 flex-shrink-0" fill="currentColor" />
            <span className="text-[9px] text-white/50 flex-1">Stand out — Send a Super Like with a message</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Scrollable card row — native scroll, no tab-switch interference ── */}
      <div
        ref={scrollRef}
        className={`flex-1 [&::-webkit-scrollbar]:hidden ${isDateIdeasTab || isProfileInfoTab || isTreatTab || tab === "gifts"
          ? "overflow-y-auto overflow-x-hidden"
          : "overflow-x-auto overflow-y-hidden"
          }`}
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
          ...(isDateIdeasTab || isProfileInfoTab || isTreatTab || tab === "gifts"
            ? { overscrollBehaviorY: "contain", touchAction: "pan-y" }
            : { overscrollBehaviorX: "contain", touchAction: "pan-x" }),
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.18 }}
            className={(isDateIdeasTab || isProfileInfoTab || isTreatTab) ? "h-full py-1" : "flex gap-2 h-full py-1"}
          >
            {isProfileInfoTab ? (
              <div
                className="grid grid-cols-3 gap-2 overflow-y-auto pb-2 rounded-xl p-2 border border-white/10"
                style={{
                  backgroundImage: "url(https://ik.imagekit.io/7grri5v7d/vip%20jhh33.png)",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundBlendMode: "overlay",
                  backgroundColor: "rgba(0,0,0,0.4)"
                }}
              >
                {(
                  [
                    { key: "basic" as const, label: "Profile", emoji: "👤", action: "section" },
                    { key: "images" as const, label: "Images", emoji: "📸", action: "section" },
                    { key: "activity" as const, label: "Online Activity", emoji: "🔍", action: "section" },
                    { key: "video" as const, label: "Video", emoji: "🎬", action: "video" },
                    { key: "cultural" as const, label: "Cultural Guide", emoji: "🌏", action: "cultural" },
                    { key: "teddy" as const, label: "Teddy Room", emoji: "🧸", action: "teddy" },
                  ] as { key: string; label: string; emoji: string; action: string }[]
                ).map((s, idx) => (
                  <motion.button
                    key={s.key}
                    type="button"
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.92 }}
                    transition={{ delay: Math.min(idx * 0.04, 0.12) }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (s.action === "video") {
                        onTabChange?.("video");
                      } else if (s.action === "cultural") {
                        onCulturalGuide?.();
                      } else if (s.action === "teddy") {
                        window.location.href = "/teddy";
                      } else {
                        onSelectProfileSection?.(s.key as "basic" | "lifestyle" | "interests" | "images" | "activity");
                      }
                    }}
                    className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl cursor-pointer transition-all hover:scale-[1.02] backdrop-blur-md border relative w-full ${selectedProfileSection === s.key ? "border-pink-500/70 ring-2 ring-pink-500/40 bg-pink-950/40" : "bg-black/50 border-white/10"}`}
                    style={{
                      height: 90,
                      ...(selectedProfileSection === s.key ? { boxShadow: "0 0 16px rgba(236,72,153,0.45), 0 0 4px rgba(236,72,153,0.3) inset" } : {}),
                    }}
                    aria-label={s.label}
                  >
                    <span className="text-xl">{s.emoji}</span>
                    <p className="text-white text-[10px] font-bold text-center leading-tight">{s.label}</p>
                  </motion.button>
                ))}
              </div>
            ) : isTreatTab ? (
              <div className="flex gap-2 h-full pb-2">
                {TREAT_ITEMS.map((item, idx) => (
                  <motion.button
                    key={item.key}
                    type="button"
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.92 }}
                    transition={{ delay: Math.min(idx * 0.06, 0.18) }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onSelectTreatItem?.(item.key);
                    }}
                    className={`relative overflow-hidden rounded-xl cursor-pointer transition-all hover:scale-[1.02] flex-shrink-0 ${selectedTreatItem === item.key
                      ? "ring-2 ring-fuchsia-400/60"
                      : ""
                      }`}
                    style={{
                      height: 124, width: 80,
                      backgroundImage: `url(${item.image})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      border: selectedTreatItem === item.key
                        ? "1.5px solid rgba(232,72,199,0.7)"
                        : "1.5px solid rgba(232,72,199,0.35)",
                    }}
                    aria-label={item.label}
                  >
                    {/* dark overlay */}
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.3) 55%, rgba(0,0,0,0.05) 100%)" }} />
                    {/* content */}
                    <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%", padding: "0 4px 6px" }}>
                      <p className="text-white text-[10px] font-bold text-center leading-tight mb-1">{item.label}</p>
                      <span style={{
                        background: "linear-gradient(135deg, hsl(320,50%,50%), hsl(315,40%,55%))",
                        color: "#fff",
                        fontSize: 8,
                        fontWeight: 700,
                        padding: "2px 7px",
                        borderRadius: 20,
                        letterSpacing: "0.03em",
                        whiteSpace: "nowrap",
                      }}>View</span>
                    </div>
                  </motion.button>
                ))}
              </div>
            ) : isUnlockTab ? (
              <div className="flex gap-2 h-full pb-2 pl-2">
                {([
                  { key: "unlock:single", emoji: null, label: "1 Unlock", price: "$1.99" },
                  { key: "unlock:pack3", emoji: null, label: "3 Pack", price: "$4.99" },
                  { key: "unlock:pack10", emoji: null, label: "10 Pack", price: "$12.99" },
                  { key: "unlock:vip", emoji: "👑", label: "VIP", price: "$10.99" },
                  { key: "unlock:superlike", emoji: "⭐", label: "Super Like", price: "$1.99" },
                  { key: "unlock:boost", emoji: "🚀", label: "Boost", price: "$1.99" },
                  { key: "unlock:verified", emoji: "✅", label: "Verified", price: "$1.99" },
                  { key: "unlock:incognito", emoji: "👻", label: "Incognito", price: "$2.99" },
                  { key: "unlock:spotlight", emoji: "🌟", label: "Spotlight", price: "$4.99" },
                ] as const).map((p, idx) => (
                  <motion.button
                    key={p.key}
                    type="button"
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.92 }}
                    transition={{ delay: Math.min(idx * 0.04, 0.24) }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onSelectUnlockItem?.(p.key);
                    }}
                    className="flex flex-col items-center justify-between p-2 rounded-xl cursor-pointer transition-all hover:scale-[1.03] bg-black/50 backdrop-blur-md flex-shrink-0"
                    style={{
                      width: 80, height: 104,
                      border: selectedUnlockItemKey === p.key
                        ? "1.5px solid rgba(236,72,153,0.85)"
                        : "1.5px solid rgba(255,255,255,0.1)",
                      boxShadow: selectedUnlockItemKey === p.key
                        ? "0 0 14px rgba(236,72,153,0.55), 0 0 6px rgba(236,72,153,0.35), inset 0 0 10px rgba(236,72,153,0.1)"
                        : "none",
                    }}
                    aria-label={p.label}
                  >
                    {p.emoji ? (
                      <span style={{ fontSize: 38 }}>{p.emoji}</span>
                    ) : (
                      <img src="https://ik.imagekit.io/7grri5v7d/logo_unlock-removebg-preview.png?updatedAt=1773430238745" alt="unlock" style={{ width: 52, height: 52, objectFit: "contain" }} />
                    )}
                    <div className="flex flex-col items-center gap-0.5">
                      <p className="text-white text-[9px] font-bold text-center leading-tight">{p.label}</p>
                      <span style={{ background: "linear-gradient(135deg, hsl(320,50%,50%), hsl(315,40%,55%))", color: "#fff", fontSize: 7, fontWeight: 700, padding: "1.5px 6px", borderRadius: 20, whiteSpace: "nowrap", marginBottom: 2 }}>View</span>
                    </div>
                  </motion.button>
                ))}
              </div>
            ) : isDateIdeasTab ? (
              !hasDateIdeas ? (
                <div className="flex items-center justify-center h-full px-4">
                  <p className="text-white/40 text-xs text-center">No date ideas yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 h-full">
                  {dateIdeas.map((place, idx) => (
                    <motion.button
                      key={`date-idea-${idx}`}
                      type="button"
                      initial={{ opacity: 0, scale: 0.92 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.92 }}
                      transition={{ delay: Math.min(idx * 0.04, 0.12) }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onSelectDateIdea?.(idx);
                      }}
                      className={`flex flex-col items-center gap-1.5 p-2 rounded-xl cursor-pointer transition-all hover:scale-[1.02] backdrop-blur-md border relative w-full ${selectedDateIdeaIndex === idx ? "border-pink-500/70 ring-2 ring-pink-500/40 bg-pink-950/40" : "bg-black/50 border-white/10"}`}
                      style={{
                        ...(selectedDateIdeaIndex === idx ? { boxShadow: "0 0 16px rgba(236,72,153,0.45), 0 0 4px rgba(236,72,153,0.3) inset" } : {}),
                      }}
                      aria-label={place.idea || "Date idea"}
                    >
                      <div className="relative w-full rounded-lg overflow-hidden" style={{ height: 70, width: "100%" }}>
                        <img
                          src={place.image_url || "/placeholder.svg"}
                          alt={place.idea}
                          className="absolute inset-0 w-full h-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
                      </div>

                      <div style={{ height: 24, display: "flex", alignItems: "center", justifyContent: "center", width: "100%" }}>
                        <p className="text-white text-[9px] font-semibold leading-tight line-clamp-2 text-center w-full" style={{ margin: 0 }}>
                          {place.idea || "Date idea"}
                        </p>
                      </div>

                      <span style={{
                        background: "linear-gradient(135deg, hsl(320,50%,50%), hsl(315,40%,55%))",
                        color: "#fff",
                        fontSize: 7,
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: 20,
                        letterSpacing: "0.03em",
                        whiteSpace: "nowrap",
                      }}>View</span>
                    </motion.button>
                  ))}

                  {dateIdeas.length === 0 && profileFirstDateIdea ? (
                    <div className="col-span-3 flex items-center justify-center px-4">
                      <div className="w-full rounded-xl bg-black/50 backdrop-blur-md border border-white/10 p-3">
                        <p className="text-white/70 text-[10px] font-semibold text-center">{profileFirstDateIdea}</p>
                      </div>
                    </div>
                  ) : null}
                </div>
              )
            ) : tab === "gifts" ? (
              <div className="overflow-y-auto flex-1 px-1 py-1">
                <GiftSelector
                  userId={currentUserId || ""}
                  profileId={selectedProfile?.id || ""}
                  profileName={selectedProfile?.name || ""}
                  onGiftSent={onGiftSent}
                />
              </div>
            ) : displayItems.length === 0 ? (
              <div className="flex items-center justify-center flex-1 px-4">
                <p className="text-white/40 text-xs text-center">{emptyText}</p>
              </div>
            ) : (
              <LikesCarousel
                displayItemsWithTarot={displayItems}
                tab={tab}
                scrollRef={scrollRef}
                onSelectProfile={onSelectProfile}
                heartDropProfileId={heartDropProfileId ?? null}
                superLikeGlowProfileId={superLikeGlowProfileId ?? null}
                activePromoIndex={activePromoIndex}
                onPurchaseFeature={onPurchaseFeature}
                matches={matches}
                isNewProfile={isNewProfile}
                iLiked={iLiked}
                currentList={currentList}
                onUnlock={onUnlock}
                onChat={onChat}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

    </div>
  );
};

export default LikesLibrary;
